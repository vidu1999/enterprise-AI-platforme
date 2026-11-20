from fastapi.testclient import TestClient
from app.main import app, _score

client = TestClient(app)

CTX = {
    "workOrders": [{"title": "Fix pump", "status": "OPEN"}, {"title": "Old job", "status": "COMPLETED"}],
    "lowStock": [{"name": "Bearing", "sku": "B-1", "quantity": 2, "reorderLevel": 10}],
    "topCostAssets": [{"asset": "Generator", "cost": 38000}],
    "employeeCount": 12,
    "assetCount": 3,
    "pendingApprovals": [{"title": "PO-1 approval", "type": "PURCHASE_ORDER"}],
    "documents": [
        {
            "id": "doc-1",
            "title": "SOP-MNT-001 Generator Vibration Policy",
            "category": "SOP",
            "content": "Generator bearings must be replaced when vibration exceeds 4.5 mm/s RMS.",
        }
    ],
}


def test_health():
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["ok"] is True


def test_ask_cost():
    r = client.post(
        "/ask",
        json={
            "question": "Which machines have highest maintenance costs?",
            "companyId": "c1",
            "role": "MANAGER",
            "context": CTX,
        },
    )
    assert r.status_code == 200
    assert "Generator" in r.json()["answer"]


def test_ask_low_stock():
    r = client.post(
        "/ask",
        json={"question": "What is low on stock?", "companyId": "c1", "role": "EMPLOYEE", "context": CTX},
    )
    assert "Bearing" in r.json()["answer"]


def test_viewer_cannot_see_employees():
    r = client.post(
        "/ask",
        json={"question": "How many employees?", "companyId": "c1", "role": "VIEWER", "context": CTX},
    )
    assert "0 employees" in r.json()["answer"]


def test_rag_policy_citations():
    r = client.post(
        "/ask",
        json={
            "question": "What is the generator vibration SOP threshold?",
            "companyId": "c1",
            "role": "EMPLOYEE",
            "context": CTX,
        },
    )
    body = r.json()
    assert r.status_code == 200
    assert "4.5 mm/s" in body["answer"]
    assert len(body["citations"]) == 1
    assert "SOP-MNT-001" in body["citations"][0]["title"]


def test_empty_question_rejected():
    r = client.post("/ask", json={"question": "  ", "companyId": "c1", "role": "EMPLOYEE", "context": CTX})
    assert r.status_code == 422


def test_document_search():
    r = client.post(
        "/documents/search",
        json={
            "query": "generator bearings",
            "companyId": "c1",
            "role": "EMPLOYEE",
            "documents": [
                {"title": "Policy", "content": "Bearings replaced annually on generators"},
                {"title": "Other", "content": "Office cleaning schedule"},
            ],
        },
    )
    assert r.json()["results"][0]["title"] == "Policy"


def test_score_fn():
    assert _score("generator bearings", "Bearings on generators") == 2
