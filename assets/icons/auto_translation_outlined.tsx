import React from 'react'

const AutoTranslationOutlined = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Globe */}
    <circle cx="12" cy="12" r="9" />

    {/* Latitude ellipses */}
    <ellipse cx="12" cy="12" rx="9" ry="3.5" opacity="0.4" />

    {/* Vertical meridian */}
    <line x1="12" y1="3" x2="12" y2="21" opacity="0.4" />

    {/* A → 文 translation hint */}
    <text
      x="9.5" y="13.5"
      fontSize="5"
      fontWeight="500"
      fill="currentColor"
      stroke="none"
      textAnchor="middle"
    >
      A
    </text>
    <text
      x="14.5" y="13.5"
      fontSize="4.5"
      fill="currentColor"
      stroke="none"
      textAnchor="middle"
    >
      文
    </text>

    {/* Sparkle — auto indicator */}
    <path
      d="M19 5 L19.6 6.8 L21.4 7.4 L19.6 8 L19 9.8 L18.4 8 L16.6 7.4 L18.4 6.8 Z"
      fill="currentColor"
      stroke="none"
      opacity="0.9"
    />
  </svg>
)

export { AutoTranslationOutlined as auto_translation_outlined }
export default AutoTranslationOutlined
