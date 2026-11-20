"""OpsPilot AI service — permission-aware business & RAG assistant (FastAPI).

Receives a natural-language question + tenant-scoped context from the NestJS
API (already filtered by companyId and role), retrieves relevant company SOP /
policy documents for citation, and produces an evidence-backed operational answer.
Uses Ollama (local LLM) when reachable; otherwise falls back to a deterministic
analytics + RAG engine so the service operates reliably offline and in CI.
"""
import os
import re
from typing import Any, Dict, List, Optional

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="OpsPilot AI Service", version="1.0.0")

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

STOP_WORDS = {
    "what", "which", "have", "this", "that", "with", "from", "the", "and",
    "for", "are", "show", "any", "how", "does", "when", "where", "who",
}


class AskRequest(BaseModel):
    question: str
    companyId: str
    role: str = "EMPLOYEE"
    context: Dict[str, Any] = Field(default_factory=dict)


class AskResponse(BaseModel):
    answer: str
    mode: str  # "ollama" | "rule-based"
    evidence: List[str] = []
    citations: List[Dict[str, Any]] = []


class DocumentSearchRequest(BaseModel):
    query: str
    companyId: str
    role: str = "EMPLOYEE"
    documents: List[Dict[str, str]] = []


def _score(query: str, text: str) -> int:
    words = {w for w in re.findall(r"[a-z0-9]+", query.lower()) if w not in STOP_WORDS}
    hay = text.lower()
    return sum(1 for w in words if w in hay)


def match_citations(question: str, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    ranked = []
    for d in documents:
        combined = f"{d.get('title', '')} {d.get('content', '')}"
        sc = _score(question, combined)
        if sc > 0:
            content = d.get("content", "")
            ranked.append({
                "id": d.get("id", ""),
                "title": d.get("title", ""),
                "category": d.get("category", "SOP"),
                "score": sc,
                "excerpt": content[:220] + ("…" if len(content) > 220 else ""),
            })
    ranked.sort(key=lambda x: x["score"], reverse=True)
    return ranked[:3]


def rule_based_answer(question: str, ctx: Dict[str, Any], citations: Optional[List[Dict[str, Any]]] = None) -> str:
    q = question.lower()
    cur = ctx.get("currency", "LKR")
    citations = citations or []

    if any(w in q for w in ["sop", "policy", "safety", "loto", "procedure", "vibration", "standard"]) and citations:
        top_doc = citations[0]
        return f"Per {top_doc['title']}: {top_doc['excerpt']}"

    if any(w in q for w in ["cost", "expensive", "maintenance", "spend"]):
        top = ctx.get("topCostAssets", [])
        if top:
            formatted = ", ".join(
                f"{a['asset']} ({cur} {a['cost']:,})" if isinstance(a.get("cost"), (int, float)) else f"{a['asset']} (cost {a['cost']})"
                for a in top
            )
            return f"Highest maintenance costs: {formatted}."
        return "No maintenance cost data available yet."

    if any(w in q for w in ["stock", "inventory", "low", "reorder"]):
        low = ctx.get("lowStock", [])
        if low:
            return (
                "Low stock items: "
                + ", ".join(
                    f"{i['name']} ({i['quantity']} left, reorder at {i['reorderLevel']})"
                    for i in low
                )
                + "."
            )
        return "All inventory is above reorder levels."

    if "work order" in q or "open" in q or "critical" in q:
        orders = ctx.get("workOrders", [])
        open_orders = [o for o in orders if o.get("status") not in ("COMPLETED", "CANCELLED")]
        titles = ", ".join(o.get("title", "") for o in open_orders[:5]) or "none"
        return f"There are {len(open_orders)} open work orders. Recent: {titles}."

    if "approval" in q or "purchase" in q:
        pending = ctx.get("pendingApprovals", [])
        if pending:
            return "Pending approvals: " + ", ".join(a.get("title", "") for a in pending) + "."
        return "No pending approvals."

    if "employee" in q or "headcount" in q or "staff" in q:
        if ctx.get("employeeDataRestricted"):
            return f"Access restricted for VIEWER role (0 employees exposed across {ctx.get('assetCount', 0)} assets)."
        return f"The company has {ctx.get('employeeCount', 0)} employees across {ctx.get('assetCount', 0)} assets."

    if citations:
        return f"Per {citations[0]['title']}: {citations[0]['excerpt']}"

    return (
        f"Summary: {ctx.get('employeeCount', 0)} employees, {ctx.get('assetCount', 0)} assets, "
        f"{len(ctx.get('workOrders', []))} work orders, {len(ctx.get('lowStock', []))} low-stock items, "
        f"{len(ctx.get('pendingApprovals', []))} pending approvals. Ask about maintenance costs, "
        "low stock, work orders, approvals, or company SOP policies for detail."
    )


async def ollama_answer(question: str, ctx: Dict[str, Any], citations: List[Dict[str, Any]]) -> Optional[str]:
    prompt = (
        "You are OpsPilot, an enterprise operations intelligence assistant. Answer ONLY from the "
        "authorized company operational data and cited SOP documents below. Cite asset codes, "
        "SKUs, and SOP titles when available.\n\n"
        f"Authorized Operational Context (JSON): {ctx}\n\n"
        f"Relevant SOP Citations: {citations}\n\n"
        f"Question: {question}\n\nAnswer concisely with concrete numbers and evidence."
    )
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            res = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            )
            if res.status_code != 200:
                return None
            text = res.json().get("response", "").strip()
            return text or None
    except Exception:
        return None


@app.get("/health")
def health():
    return {"ok": True, "service": "opspilot-ai", "ollamaUrl": OLLAMA_URL, "model": OLLAMA_MODEL}


@app.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    if not req.question.strip():
        raise HTTPException(status_code=422, detail="question must not be empty")

    # Permission gate: viewers never see employee-level detail.
    ctx = dict(req.context)
    if req.role == "VIEWER":
        ctx["employeeCount"] = 0
        ctx["employeeDataRestricted"] = True
        ctx["workOrders"] = []

    citations = match_citations(req.question, ctx.get("documents", []))
    llm = await ollama_answer(req.question, ctx, citations)
    evidence = ctx.get("evidence") or [
        f"Computed from {len(ctx.get('workOrders', []))} work orders, "
        f"{len(ctx.get('lowStock', []))} low-stock items, "
        f"{ctx.get('assetCount', 0)} assets."
    ]

    if llm:
        return AskResponse(answer=llm, mode="ollama", evidence=evidence, citations=citations)

    answer = rule_based_answer(req.question, ctx, citations)
    return AskResponse(answer=answer, mode="rule-based", evidence=evidence, citations=citations)


@app.post("/documents/search")
def search_documents(req: DocumentSearchRequest):
    scored = sorted(
        (
            {
                "title": d.get("title", ""),
                "score": _score(req.query, f"{d.get('title', '')} {d.get('content', '')}"),
            }
            for d in req.documents
        ),
        key=lambda x: x["score"],
        reverse=True,
    )
    return {"results": [r for r in scored if r["score"] > 0][:5]}
