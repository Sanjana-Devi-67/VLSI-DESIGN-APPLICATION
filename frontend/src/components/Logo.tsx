export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Gradients for rings */}
        <linearGradient id="cyan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
        </linearGradient>
        
        <linearGradient id="purple-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d946ef" stopOpacity="1" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
        </linearGradient>

        <linearGradient id="text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="40%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>

        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
          <stop offset="30%" stopColor="#22d3ee" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Glow Center */}
      <circle cx="200" cy="120" r="50" fill="url(#glow)" />
      
      {/* Core Dot */}
      <circle cx="200" cy="120" r="8" fill="#ffffff" filter="drop-shadow(0 0 8px #22d3ee)" />
      
      {/* Horizontal Cyan Ring */}
      <ellipse cx="200" cy="120" rx="120" ry="35" fill="none" stroke="url(#cyan-grad)" strokeWidth="4" />
      
      {/* Tilted Purple Ring */}
      <g transform="rotate(-25 200 120)">
        <ellipse cx="200" cy="120" rx="90" ry="40" fill="none" stroke="url(#purple-grad)" strokeWidth="4" />
        {/* Orbital particles */}
        <circle cx="290" cy="120" r="4" fill="#d946ef" filter="drop-shadow(0 0 5px #d946ef)" />
        <circle cx="110" cy="120" r="3" fill="#8b5cf6" />
      </g>
      
      {/* Tilted Cyan Ring 2 empty */}
      <g transform="rotate(35 200 120)">
        <ellipse cx="200" cy="120" rx="100" ry="30" fill="none" stroke="url(#cyan-grad)" strokeWidth="3" opacity="0.8" />
        <circle cx="100" cy="120" r="5" fill="#22d3ee" filter="drop-shadow(0 0 5px #22d3ee)" />
      </g>

      {/* Additional small floating particles */}
      <circle cx="160" cy="70" r="2" fill="#22d3ee" />
      <circle cx="240" cy="160" r="2.5" fill="#d946ef" />
      
      {/* QANTYX Text Bottom */}
      <text 
        x="200" 
        y="250" 
        textAnchor="middle" 
        fontFamily="sans-serif" 
        fontSize="65" 
        fontWeight="800" 
        letterSpacing="6" 
        fill="url(#text-grad)"
      >
        QANTYX
      </text>
    </svg>
  );
}
