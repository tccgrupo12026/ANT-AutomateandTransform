import React from 'react';

interface AntLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  textVariant?: 'header' | 'sidebar' | 'compact';
  subtitle?: boolean;
}

export const AntLogo: React.FC<AntLogoProps> = ({
  className = '',
  size = 36,
  showText = false,
  textVariant = 'header',
  subtitle = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Official ANT Graphic Representation with mandatory white background */}
      <div
        className="relative shrink-0 flex items-center justify-center bg-white rounded-xl p-1 shadow-xs border border-slate-100 dark:border-slate-800"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full object-contain"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="ant-official-logo">
            {/* Green Leaf with bite mark */}
            <path
              d="M70 230 C65 210 80 185 95 170 C105 160 115 150 145 130 C175 110 210 115 215 135 C200 155 180 175 160 210 C145 235 110 245 70 230 Z"
              fill="#00C48C"
            />
            {/* Bite mark on leaf */}
            <path
              d="M70 225 C85 220 90 195 82 185 C92 180 98 165 92 155 C102 150 110 140 120 135"
              fill="#ffffff"
            />
            {/* Leaf purple veins */}
            <path
              d="M195 135 L90 220"
              stroke="#6D28D9"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M165 160 L140 145"
              stroke="#6D28D9"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M135 185 L105 215"
              stroke="#6D28D9"
              strokeWidth="7"
              strokeLinecap="round"
            />

            {/* Antennae */}
            <path
              d="M225 170 C220 130 225 110 235 105 C240 102 245 105 242 115 C238 135 235 155 238 175"
              stroke="#6D28D9"
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M250 175 C255 140 265 120 275 115 C280 112 284 116 280 125 C272 145 265 160 262 185"
              stroke="#6D28D9"
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
            />

            {/* Head */}
            <path
              d="M245 165 C220 160 175 185 160 215 C150 235 170 245 195 240 C225 235 260 225 265 195 C268 180 260 168 245 165 Z"
              fill="#6D28D9"
            />

            {/* Thorax / Mid Body */}
            <path
              d="M225 225 C225 225 235 285 295 280 C310 278 320 260 305 240 C285 215 255 215 225 225 Z"
              fill="#6D28D9"
            />
            {/* Thorax Green Spot */}
            <ellipse
              cx="270"
              cy="245"
              rx="16"
              ry="10"
              transform="rotate(-25 270 245)"
              fill="#00C48C"
            />

            {/* Abdomen / Rear Body */}
            <path
              d="M295 265 C320 240 375 240 415 275 C445 305 440 345 400 350 C345 355 295 310 295 265 Z"
              fill="#6D28D9"
            />
            {/* Abdomen Green Spot */}
            <ellipse
              cx="360"
              cy="265"
              rx="18"
              ry="11"
              transform="rotate(-35 360 265)"
              fill="#00C48C"
            />

            {/* Legs */}
            <path
              d="M235 240 C215 265 200 295 205 330 C207 350 200 375 190 395 C187 400 197 403 203 398 C215 375 220 345 220 325 C225 290 245 265 250 250"
              fill="#6D28D9"
            />
            <path
              d="M270 265 C265 295 268 335 275 370 C278 390 280 405 284 415 C288 417 293 412 291 405 C285 385 282 355 280 325 C280 295 290 280 290 275"
              fill="#6D28D9"
            />
            <path
              d="M320 285 C345 315 365 350 370 385 C372 405 382 418 385 422 C390 422 393 415 388 408 C382 385 375 355 355 320 C345 305 335 290 330 285"
              fill="#6D28D9"
            />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight text-purple-900 dark:text-purple-300 ${
                textVariant === 'header'
                  ? 'text-xl sm:text-2xl'
                  : textVariant === 'sidebar'
                  ? 'text-xl'
                  : 'text-base'
              }`}
            >
              ANT
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">
              Automate and Transform
            </span>
          )}
        </div>
      )}
    </div>
  );
};
