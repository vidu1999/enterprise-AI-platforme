import React from 'react';

const PALETTES = [
  ['#0ea5e9', '#1e3a8a'],
  ['#10b981', '#064e3b'],
  ['#a855f7', '#4c1d95'],
  ['#f59e0b', '#78350f'],
  ['#ec4899', '#831843'],
  ['#14b8a6', '#134e4a'],
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

export default function Avatar({
  name,
  size = 38,
  online = true,
}: {
  name: string;
  size?: number;
  online?: boolean;
}) {
  const clean = (name || 'User').trim();
  const parts = clean.split(/\s+/);
  const initials = ((parts[0]?.[0] ?? 'U') + (parts[1]?.[0] ?? '')).toUpperCase();
  const [c1, c2] = PALETTES[hashName(clean) % PALETTES.length];

  return (
    <div className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-full flex items-center justify-center font-bold text-white border border-white/15 shadow-md select-none"
        style={{
          background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
          fontSize: Math.max(11, Math.round(size * 0.36)),
        }}
      >
        {initials}
      </div>
      {online && (
        <span
          className="absolute bottom-0 right-0 block rounded-full bg-emerald-400 ring-2 ring-[#0b1523]"
          style={{ width: Math.max(8, Math.round(size * 0.24)), height: Math.max(8, Math.round(size * 0.24)) }}
        />
      )}
    </div>
  );
}
