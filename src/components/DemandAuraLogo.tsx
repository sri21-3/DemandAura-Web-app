import React, { useId } from 'react';

interface DemandAuraLogoProps {
  className?: string;
  size?: number;
}

/**
 * Official DemandAura brand mark:
 * Circular dark-navy badge with a luminous cyan-to-violet aura ring
 * surrounding a crisp white core and 3 ascending gradient demand bars.
 */
export const DemandAuraLogo: React.FC<DemandAuraLogoProps> = ({
  className = '',
  size = 32,
}) => {
  const uid = useId().replace(/:/g, '');

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      aria-label="DemandAura Logo"
      role="img"
      className={`shrink-0 select-none ${className}`}
    >
      <defs>
        <linearGradient
          id={`da-outer-bg-${uid}`}
          x1="10"
          y1="10"
          x2="110"
          y2="110"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0B2247" />
          <stop offset="50%" stopColor="#0F1738" />
          <stop offset="100%" stopColor="#1D1138" />
        </linearGradient>

        <linearGradient
          id={`da-aura-grad-1-${uid}`}
          x1="16"
          y1="20"
          x2="104"
          y2="100"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2AF5D6" />
          <stop offset="35%" stopColor="#00D4FF" />
          <stop offset="70%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#F042FF" />
        </linearGradient>

        <linearGradient
          id={`da-aura-grad-2-${uid}`}
          x1="12"
          y1="75"
          x2="105"
          y2="35"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="45%" stopColor="#2DD4BF" />
          <stop offset="80%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>

        <linearGradient
          id={`da-bar-1-${uid}`}
          x1="42"
          y1="67"
          x2="42"
          y2="95"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="55%" stopColor="#1E40AF" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        <linearGradient
          id={`da-bar-2-${uid}`}
          x1="60"
          y1="55"
          x2="60"
          y2="95"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="55%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>

        <linearGradient
          id={`da-bar-3-${uid}`}
          x1="78"
          y1="42"
          x2="78"
          y2="95"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2AF5D6" />
          <stop offset="45%" stopColor="#38BDF8" />
          <stop offset="80%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#2E1065" />
        </linearGradient>

        <filter
          id={`da-glow-${uid}`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <clipPath id={`da-inner-clip-${uid}`}>
          <circle cx="60" cy="60" r="34" />
        </clipPath>
      </defs>

      {/* Outer Dark Navy Circle */}
      <circle
        cx="60"
        cy="60"
        r="56"
        fill={`url(#da-outer-bg-${uid})`}
        stroke="#091128"
        strokeWidth="2.5"
      />

      {/* Glowing Aura Swirl Rings */}
      <g filter={`url(#da-glow-${uid})`}>
        <circle
          cx="60"
          cy="60"
          r="44"
          stroke={`url(#da-aura-grad-1-${uid})`}
          strokeWidth="4.5"
          opacity="0.95"
        />
        <ellipse
          cx="60"
          cy="60"
          rx="46.5"
          ry="42.5"
          transform="rotate(-28 60 60)"
          stroke={`url(#da-aura-grad-2-${uid})`}
          strokeWidth="2.4"
          opacity="0.85"
        />
        <ellipse
          cx="60"
          cy="60"
          rx="42.5"
          ry="46"
          transform="rotate(32 60 60)"
          stroke={`url(#da-aura-grad-1-${uid})`}
          strokeWidth="2"
          opacity="0.8"
        />
      </g>

      {/* Crisp Highlight Arcs on Aura */}
      <path
        d="M 23 40 A 43 43 0 0 1 78 20"
        stroke="#72FACA"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M 97 42 A 44 44 0 0 1 68 103"
        stroke="#F472B6"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Inner White Circle */}
      <circle cx="60" cy="60" r="34" fill="#FFFFFF" />

      {/* 3 Ascending Demand Bars Clipped to Inner Circle */}
      <g clipPath={`url(#da-inner-clip-${uid})`}>
        <rect
          x="37"
          y="68"
          width="11"
          height="32"
          rx="1"
          fill={`url(#da-bar-1-${uid})`}
          stroke="#0B132B"
          strokeWidth="2.2"
        />
        <rect
          x="55"
          y="55"
          width="11"
          height="45"
          rx="1"
          fill={`url(#da-bar-2-${uid})`}
          stroke="#0B132B"
          strokeWidth="2.2"
        />
        <rect
          x="73"
          y="42"
          width="11"
          height="58"
          rx="1"
          fill={`url(#da-bar-3-${uid})`}
          stroke="#0B132B"
          strokeWidth="2.2"
        />
      </g>

      {/* Inner Circle Dark Framing Ring */}
      <circle cx="60" cy="60" r="34" stroke="#0B1536" strokeWidth="2.8" />
    </svg>
  );
};
