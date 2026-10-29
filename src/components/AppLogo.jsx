import React from 'react';

export default function AppLogo({ className = "w-10 h-10 sm:w-11 sm:h-11" }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/20 ring-1 ring-white/20 dark:ring-white/10 ${className}`}>
      <svg 
        viewBox="0 0 512 512" 
        className="w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1E293B" />
            <stop offset="50%" stop-color="#0F172A" />
            <stop offset="100%" stop-color="#020617" />
          </linearGradient>

          <radialGradient id="logoGlow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="#10B981" stop-opacity="0.38" />
            <stop offset="60%" stop-color="#059669" stop-opacity="0.08" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0" />
          </radialGradient>

          <linearGradient id="logoMint" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#059669" />
            <stop offset="35%" stop-color="#10B981" />
            <stop offset="80%" stop-color="#34D399" />
            <stop offset="100%" stop-color="#A7F3D0" />
          </linearGradient>

          <linearGradient id="logoChrome" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="45%" stop-color="#F8FAFC" />
            <stop offset="100%" stop-color="#94A3B8" />
          </linearGradient>
        </defs>

        {/* Background & Ambient Glow */}
        <rect width="512" height="512" fill="url(#logoBg)" />
        <rect width="512" height="512" fill="url(#logoGlow)" />

        {/* Dynamic Speed & Revenue Gauge Arc */}
        <path 
          d="M 115 330 A 155 155 0 1 1 397 330" 
          fill="none" 
          stroke="url(#logoMint)" 
          stroke-width="20" 
          stroke-linecap="round"
        />

        {/* Micro Gauge Accents */}
        <circle cx="115" cy="330" r="8" fill="#10B981" />
        <circle cx="397" cy="330" r="8" fill="#34D399" />
        <circle cx="256" cy="101" r="6" fill="#A7F3D0" />

        {/* Sleek Apple-style Aerodynamic Vehicle Silhouette */}
        {/* Cabin roofline */}
        <path 
          d="M 174 270 
             C 186 236, 208 212, 240 208 
             L 272 208 
             C 304 212, 326 236, 338 270 
             Z" 
          fill="#0F172A" 
          stroke="url(#logoChrome)" 
          stroke-width="8" 
          stroke-linejoin="round"
        />
        
        {/* Tinted Glass Reflection */}
        <path 
          d="M 192 266 
             C 202 244, 218 224, 244 221 
             L 268 221 
             C 294 224, 310 244, 320 266 
             Z" 
          fill="url(#logoMint)" 
          opacity="0.35" 
        />

        {/* Lower Chassis & Aerodynamic Body */}
        <path 
          d="M 152 284 
             C 142 284, 134 292, 134 304 
             L 134 320 
             C 134 328, 140 334, 148 334 
             L 164 334 
             C 168 334, 172 328, 172 320 
             L 340 320 
             C 340 328, 344 334, 348 334 
             L 364 334 
             C 372 334, 378 328, 378 320 
             L 378 304 
             C 378 292, 370 284, 360 284 
             L 344 280 
             C 334 274, 326 270, 316 270 
             L 196 270 
             C 186 270, 178 274, 168 280 
             Z" 
          fill="url(#logoChrome)" 
          stroke="#FFFFFF" 
          stroke-width="3"
          stroke-linejoin="round"
        />

        {/* LED Headlights */}
        <path d="M 152 298 L 186 296" stroke="#34D399" stroke-width="7" stroke-linecap="round" />
        <path d="M 360 298 L 326 296" stroke="#34D399" stroke-width="7" stroke-linecap="round" />

        {/* Center Illuminated Emblem */}
        <rect x="245" y="293" width="22" height="8" rx="4" fill="#10B981" />

        {/* Ground Glow Speed Lines */}
        <path d="M 188 356 L 324 356" stroke="#10B981" stroke-width="4.5" stroke-linecap="round" opacity="0.7" />
        <path d="M 216 370 L 296 370" stroke="#059669" stroke-width="3.5" stroke-linecap="round" opacity="0.4" />
      </svg>
    </div>
  );
}
