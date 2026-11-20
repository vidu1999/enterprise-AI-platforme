import React from 'react';

export default function OpsLogo({
  size = 'md',
  subtitle,
}: {
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
}) {
  const iconDim = size === 'lg' ? 44 : size === 'sm' ? 28 : 34;
  const textClass =
    size === 'lg'
      ? 'text-3xl font-extrabold tracking-tight'
      : size === 'sm'
        ? 'text-lg font-bold tracking-tight'
        : 'text-[22px] font-extrabold tracking-tight';

  return (
    <div className="inline-flex flex-col">
      <div className="inline-flex items-center gap-2.5">
        <svg
          width={iconDim}
          height={iconDim}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_12px_rgba(0,224,130,0.45)] shrink-0"
        >
          <defs>
            <linearGradient id="opsEmeraldGrad" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2eff9d" />
              <stop offset="55%" stopColor="#00d678" />
              <stop offset="100%" stopColor="#048c53" />
            </linearGradient>
          </defs>
          {/* Geometric futuristic 'A' / delta chevron mark matching reference */}
          <path
            d="M24 5L6.5 40.5C5.9 41.7 7.1 43 8.3 42.4L18.2 37.3L24 23.5L29.8 37.3L39.7 42.4C40.9 43 42.1 41.7 41.5 40.5L24 5Z"
            fill="url(#opsEmeraldGrad)"
          />
          <path
            d="M17.5 32.5L24 19L30.5 32.5H17.5Z"
            fill="#07111d"
          />
          <path
            d="M19.5 34.5H28.5L24 29.5L19.5 34.5Z"
            fill="url(#opsEmeraldGrad)"
          />
        </svg>
        <span className={`${textClass} text-white`}>OpsPilot</span>
      </div>
      {subtitle && <p className="text-xs text-slate-300/90 mt-1 tracking-wide">{subtitle}</p>}
    </div>
  );
}
