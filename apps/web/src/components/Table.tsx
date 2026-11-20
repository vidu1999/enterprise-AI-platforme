import React from 'react';

export default function Table({
  columns,
  rows,
}: {
  columns: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl ops-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] text-left text-xs font-semibold text-slate-400">
            {columns.map((c) => (
              <th key={c} className="px-5 py-3.5 whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className="border-b last:border-b-0 border-white/[0.045] hover:bg-emerald-500/[0.04] transition-colors"
            >
              {r.map((cell, j) => (
                <td key={j} className="px-5 py-3.5 align-middle text-slate-200">
                  {cell === null || cell === undefined || cell === '' ? '—' : cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-5 py-12 text-center text-slate-500 text-xs">
                No records match the current filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
