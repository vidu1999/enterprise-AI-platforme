import React from 'react';

export default function Table({
  columns,
  rows,
}: {
  columns: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-900/90 text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            {columns.map((c) => (
              <th key={c} className="px-4 py-3 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-800/80 hover:bg-slate-900/70 transition-colors">
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-middle text-slate-200">
                  {cell === null || cell === undefined || cell === '' ? '—' : cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">
                No records match the current filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
