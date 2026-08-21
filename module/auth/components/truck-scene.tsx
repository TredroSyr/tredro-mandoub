import Image from "next/image";

export default function TruckScene() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-primary">
      {/* <div className="absolute inset-x-0 top-4 z-10 flex justify-center">
        <Image
          src="/tredro/full_logo.svg"
          alt="Tredro Logo"
          width={160}
          height={80}
          unoptimized
          priority
        />
      </div> */}

      <svg
        viewBox="0 0 400 340"
        className="h-full w-full"
        role="img"
        aria-label="شاحنة توصيل تصل إلى محل وتُفرّغ البضاعة"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              style={{
                stopColor: "color-mix(in oklch, var(--primary), white 45%)",
              }}
            />
            <stop
              offset="100%"
              style={{
                stopColor: "color-mix(in oklch, var(--primary), white 15%)",
              }}
            />
          </linearGradient>
        </defs>

        <rect width="400" height="340" fill="url(#sky)" />

        {/* أبنية خلفية */}
        <g opacity="0.35" fill="white">
          <rect x="10" y="120" width="46" height="130" rx="6" />
          <rect x="66" y="90" width="38" height="160" rx="6" />
          <rect x="300" y="105" width="44" height="145" rx="6" />
          <rect x="352" y="140" width="38" height="110" rx="6" />
        </g>

        {/* المحل */}
        <g>
          <rect
            x="150"
            y="140"
            width="120"
            height="110"
            rx="10"
            fill="white"
            opacity="0.96"
          />
          <rect
            x="150"
            y="140"
            width="120"
            height="26"
            rx="8"
            fill="color-mix(in oklch, var(--primary), black 12%)"
          />
          <g
            fill="color-mix(in oklch, var(--primary), white 25%)"
            opacity="0.9"
          >
            <rect x="162" y="176" width="42" height="34" rx="5" />
            <rect x="216" y="176" width="42" height="34" rx="5" />
          </g>
          <rect
            x="192"
            y="214"
            width="36"
            height="36"
            rx="4"
            fill="color-mix(in oklch, var(--primary), black 12%)"
          />
        </g>

        {/* الزبون */}
        <g className="animate-[customerIn_7s_ease-in-out_infinite]">
          <circle cx="288" cy="212" r="9" fill="white" />
          <rect x="279" y="224" width="18" height="26" rx="8" fill="white" />
          <g
            className="animate-[wave_7s_ease-in-out_infinite]"
            style={{ transformOrigin: "279px 230px" }}
          >
            <rect x="270" y="226" width="12" height="5" rx="2.5" fill="white" />
          </g>
        </g>

        {/* الطريق */}
        <rect
          x="0"
          y="250"
          width="400"
          height="90"
          fill="color-mix(in oklch, var(--primary), black 30%)"
        />
        <g fill="white" opacity="0.75">
          <rect
            className="animate-[roadDash_1.1s_linear_infinite]"
            x="0"
            y="292"
            width="400"
            height="5"
            rx="2.5"
            fillOpacity="0.0"
          />
          {[0, 60, 120, 180, 240, 300, 360].map((x) => (
            <rect
              key={x}
              x={x}
              y="292"
              width="34"
              height="5"
              rx="2.5"
              className="animate-[roadDash_1.1s_linear_infinite]"
            />
          ))}
        </g>

        {/* الصناديق التي تُنزَّل */}
        <g className="animate-[boxDrop_7s_ease-in-out_infinite]">
          <rect
            x="236"
            y="228"
            width="22"
            height="20"
            rx="3"
            fill="oklch(0.85 0.09 62)"
          />
          <rect
            x="236"
            y="235"
            width="22"
            height="3"
            fill="oklch(0.62 0.13 62)"
          />
        </g>

        {/* الشاحنة */}
        <g className="animate-[truckDrive_7s_ease-in-out_infinite]">
          <rect x="20" y="212" width="66" height="46" rx="7" fill="white" />
          <path d="M86 230h22l18 16v12H86z" fill="white" />
          <rect
            x="92"
            y="232"
            width="16"
            height="12"
            rx="3"
            fill="color-mix(in oklch, var(--primary), black 12%)"
          />
          <g fill="color-mix(in oklch, var(--primary), black 12%)">
            <rect x="30" y="222" width="46" height="10" rx="3" opacity="0.35" />
          </g>
          <g>
            <circle
              cx="44"
              cy="262"
              r="10"
              fill="color-mix(in oklch, var(--primary), black 55%)"
            />
            <circle cx="44" cy="262" r="4" fill="white" />
            <circle
              cx="112"
              cy="262"
              r="10"
              fill="color-mix(in oklch, var(--primary), black 55%)"
            />
            <circle cx="112" cy="262" r="4" fill="white" />
          </g>
        </g>
      </svg>
    </div>
  );
}
