type CreatorDoodleClusterProps = {
  compact?: boolean;
};

export default function CreatorDoodleCluster({ compact = false }: CreatorDoodleClusterProps) {
  const sizeClass = compact ? "h-[280px] sm:h-[320px]" : "h-[360px] sm:h-[420px]";
  return (
    <div className={`doodle-canvas ${sizeClass}`}>
      <svg viewBox="0 0 620 420" className="h-full w-full" role="img" aria-label="Creator personas illustration">
        <defs>
          <style>
            {`
              .stroke { stroke: hsl(var(--foreground)); stroke-width: 3; fill: none; stroke-linecap: round; stroke-linejoin: round; }
              .accentA { fill: #ff6f61; }
              .accentB { fill: #6b8cff; }
              .accentC { fill: #ffc857; }
              .float-slow { animation: floatSlow 5.2s ease-in-out infinite; transform-origin: center; }
              .float-mid { animation: floatMid 4.6s ease-in-out infinite; transform-origin: center; }
              .pulse { animation: pulseDot 2.4s ease-in-out infinite; transform-origin: center; }
              @keyframes floatSlow { 0%,100% { transform: translateY(0px);} 50% { transform: translateY(-6px);} }
              @keyframes floatMid { 0%,100% { transform: translateY(0px);} 50% { transform: translateY(-9px);} }
              @keyframes pulseDot { 0%,100% { transform: scale(1);} 50% { transform: scale(1.2);} }
              @media (prefers-reduced-motion: reduce) {
                .float-slow,.float-mid,.pulse { animation: none; }
              }
            `}
          </style>
        </defs>

        <g className="float-slow" transform="translate(45 60)">
          <circle cx="66" cy="60" r="30" className="accentA" opacity="0.25" />
          <circle cx="66" cy="50" r="20" className="stroke" />
          <path d="M32 102c8-26 63-26 72 0" className="stroke" />
          <rect x="20" y="118" width="94" height="56" rx="14" className="stroke" />
          <circle cx="56" cy="143" r="6" className="accentB pulse" />
          <circle cx="80" cy="143" r="6" className="accentC pulse" />
        </g>

        <g className="float-mid" transform="translate(250 30)">
          <circle cx="72" cy="58" r="30" className="accentB" opacity="0.22" />
          <circle cx="72" cy="48" r="21" className="stroke" />
          <path d="M35 104c10-28 67-28 78 0" className="stroke" />
          <rect x="32" y="118" width="84" height="50" rx="12" className="stroke" />
          <path d="M18 132h24" className="stroke" />
          <path d="M120 132h24" className="stroke" />
          <circle cx="76" cy="146" r="7" className="accentA pulse" />
        </g>

        <g className="float-slow" transform="translate(435 92)">
          <circle cx="60" cy="54" r="28" className="accentC" opacity="0.22" />
          <circle cx="60" cy="46" r="18" className="stroke" />
          <path d="M25 94c8-24 54-24 66 0" className="stroke" />
          <path d="M20 132l82-24" className="stroke" />
          <rect x="14" y="120" width="16" height="20" rx="4" className="accentA" opacity="0.7" />
          <rect x="95" y="104" width="18" height="24" rx="4" className="accentB" opacity="0.7" />
        </g>

        <g className="float-mid" transform="translate(170 226)">
          <rect x="0" y="0" width="286" height="160" rx="26" className="stroke" />
          <path d="M28 38h82" className="stroke" />
          <path d="M28 72h228" className="stroke" />
          <path d="M28 104h190" className="stroke" />
          <circle cx="240" cy="38" r="10" className="accentA pulse" />
          <circle cx="266" cy="38" r="10" className="accentB pulse" />
          <circle cx="240" cy="104" r="10" className="accentC pulse" />
        </g>
      </svg>
    </div>
  );
}
