/**
 * Lio, the LoyalChain mascot: a golden loyalty coin in a chef's hat, held together by chain-link arms.
 * The coin is the points, the hat is the restaurant, the links are the chain.
 */

export type MascotMood = "happy" | "wink" | "cheer" | "sleepy" | "think";

const INK = "#2A1810";

function Eyes({ mood }: { mood: MascotMood }) {
  switch (mood) {
    case "cheer":
      return (
        <g fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round">
          <path d="M72 120 Q82 108 92 120" />
          <path d="M108 120 Q118 108 128 120" />
        </g>
      );
    case "sleepy":
      return (
        <g fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round">
          <path d="M72 118 Q82 126 92 118" />
          <path d="M108 118 Q118 126 128 118" />
        </g>
      );
    case "wink":
      return (
        <g>
          <g className="lio-blink">
            <ellipse cx="82" cy="118" rx="6.5" ry="8" fill={INK} />
            <circle cx="84.5" cy="115" r="2.4" fill="#fff" />
          </g>
          <path
            d="M108 119 Q118 109 128 119"
            fill="none"
            stroke={INK}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      );
    case "think":
      return (
        <g className="lio-blink">
          <ellipse cx="82" cy="118" rx="6.5" ry="8" fill={INK} />
          <ellipse cx="118" cy="118" rx="6.5" ry="8" fill={INK} />
          <circle cx="85" cy="114.5" r="2.4" fill="#fff" />
          <circle cx="121" cy="114.5" r="2.4" fill="#fff" />
        </g>
      );
    default:
      return (
        <g className="lio-blink">
          <ellipse cx="82" cy="118" rx="6.5" ry="8" fill={INK} />
          <ellipse cx="118" cy="118" rx="6.5" ry="8" fill={INK} />
          <circle cx="84.5" cy="115" r="2.4" fill="#fff" />
          <circle cx="120.5" cy="115" r="2.4" fill="#fff" />
        </g>
      );
  }
}

function Mouth({ mood }: { mood: MascotMood }) {
  switch (mood) {
    case "cheer":
      return (
        <path
          d="M84 138 Q100 168 116 138 Z"
          fill="#8A2B12"
          stroke={INK}
          strokeWidth="4"
          strokeLinejoin="round"
        />
      );
    case "sleepy":
      return <ellipse cx="100" cy="146" rx="6" ry="4.5" fill="#8A2B12" />;
    case "think":
      return (
        <path d="M90 146 Q100 142 112 147" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
      );
    default:
      return (
        <path d="M86 140 Q100 156 114 140" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
      );
  }
}

export function Mascot({
  mood = "happy",
  animated = true,
  className = "h-24 w-24",
  title,
}: {
  mood?: MascotMood;
  /** Gentle floating and blinking. Turned off automatically for people who prefer reduced motion. */
  animated?: boolean;
  className?: string;
  /** Accessible name. Leave empty when the mascot is only decoration. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 220"
      className={`${className} ${animated ? "lio-float" : ""}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <radialGradient id="lio-coin" cx="35%" cy="28%" r="85%">
          <stop offset="0" stopColor="#FFE9A8" />
          <stop offset="0.55" stopColor="#FFC94D" />
          <stop offset="1" stopColor="#F59A2B" />
        </radialGradient>
        <linearGradient id="lio-hat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F1E6DC" />
        </linearGradient>
      </defs>

      <ellipse cx="100" cy="205" rx="48" ry="8" fill="#000" opacity="0.28" />

      {/* Chain-link arms */}
      <g fill="none" stroke="#F07340" strokeWidth="8" strokeLinecap="round">
        <g transform={mood === "cheer" ? "rotate(-34 40 136)" : "rotate(-18 40 136)"}>
          <rect x="6" y="122" width="44" height="22" rx="11" />
        </g>
        <g transform={mood === "cheer" ? "rotate(34 160 136)" : "rotate(18 160 136)"}>
          <rect x="150" y="122" width="44" height="22" rx="11" />
        </g>
      </g>

      {/* Little feet */}
      <ellipse cx="80" cy="190" rx="14" ry="8" fill="#C9531F" />
      <ellipse cx="120" cy="190" rx="14" ry="8" fill="#C9531F" />

      {/* Coin body */}
      <circle cx="100" cy="128" r="64" fill="url(#lio-coin)" stroke="#D9731D" strokeWidth="5" />
      <circle
        cx="100"
        cy="128"
        r="53"
        fill="none"
        stroke="#D9731D"
        strokeWidth="2"
        strokeDasharray="3 6"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path d="M58 96 Q66 78 88 72" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.5" />

      {/* Chef hat */}
      <g stroke="#D9C9BA" strokeWidth="3" strokeLinejoin="round">
        <circle cx="76" cy="52" r="16" fill="url(#lio-hat)" />
        <circle cx="124" cy="52" r="16" fill="url(#lio-hat)" />
        <circle cx="100" cy="42" r="21" fill="url(#lio-hat)" />
        <rect x="68" y="58" width="64" height="22" rx="8" fill="url(#lio-hat)" />
      </g>
      <rect x="68" y="72" width="64" height="8" rx="4" fill="#F07340" opacity="0.9" />

      <Eyes mood={mood} />
      <circle cx="68" cy="138" r="8" fill="#FF7A6B" opacity="0.45" />
      <circle cx="132" cy="138" r="8" fill="#FF7A6B" opacity="0.45" />
      <Mouth mood={mood} />

      {mood === "cheer" ? (
        <g fill="#FFE9A8" stroke="#F07340" strokeWidth="2" strokeLinejoin="round">
          <path d="M28 52 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z" />
          <path d="M172 40 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
        </g>
      ) : null}
      {mood === "sleepy" ? (
        <g fill="#FFE9A8" fontFamily="ui-sans-serif, system-ui" fontWeight="700">
          <text x="150" y="86" fontSize="20">z</text>
          <text x="166" y="66" fontSize="26">Z</text>
        </g>
      ) : null}
      {mood === "think" ? (
        <g fill="#FFE9A8" stroke="#F07340" strokeWidth="2">
          <circle cx="156" cy="90" r="4" />
          <circle cx="168" cy="72" r="6" />
        </g>
      ) : null}
    </svg>
  );
}
