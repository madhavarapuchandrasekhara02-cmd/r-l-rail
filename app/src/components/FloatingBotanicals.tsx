"use client";
import React from "react";
import "./FloatingBotanicals.css";

/*
 * Premium botanical leaves — inspired by Natural Lab / Forest Essentials style.
 * Large, lush, realistic botanical branches placed at page edges & corners,
 * partially cropping off-screen for a high-end editorial feel.
 */

/* ── Palette ── */
const leaf1 = "#3D5A2A";   // deep olive
const leaf2 = "#4A6741";   // medium green
const leaf3 = "#5B7A4A";   // light sage
const stem  = "#5C3D1E";   // warm brown
const vein  = "#2E4A1E";   // dark green veins

/* ─── Large Branch (top-left, swooping in from corner) ─── */
function BranchTopLeft() {
  return (
    <svg width="420" height="380" viewBox="0 0 420 380" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main stem curving from top-left */}
      <path d="M-10 -20 C40 40, 80 100, 140 160 C180 200, 220 230, 280 260 C320 280, 360 290, 400 295"
        stroke={stem} strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Branch fork */}
      <path d="M140 160 C120 200, 100 240, 90 280"
        stroke={stem} strokeWidth="2.2" strokeLinecap="round" fill="none" />

      {/* Leaf cluster 1 — large leaf at top */}
      <g transform="translate(50, 30) rotate(-35)">
        <path d="M0 0 C-15 -40, 5 -85, 0 -110 C10 -85, 30 -40, 0 0Z"
          fill={leaf1} fillOpacity="0.85" stroke={leaf1} strokeWidth="0.8" />
        <path d="M0 0 C0 -30, 0 -70, 0 -110" stroke={vein} strokeWidth="0.6" opacity="0.4" />
        <path d="M0 -30 C-8 -38, -12 -50, -10 -55" stroke={vein} strokeWidth="0.4" opacity="0.3" />
        <path d="M0 -30 C8 -40, 10 -48, 8 -52" stroke={vein} strokeWidth="0.4" opacity="0.3" />
        <path d="M0 -60 C-10 -68, -14 -78, -12 -82" stroke={vein} strokeWidth="0.4" opacity="0.3" />
        <path d="M0 -60 C10 -70, 12 -76, 10 -80" stroke={vein} strokeWidth="0.4" opacity="0.3" />
      </g>

      {/* Leaf cluster 2 — medium leaf */}
      <g transform="translate(100, 100) rotate(-15)">
        <path d="M0 0 C-12 -30, 3 -60, 0 -80 C8 -60, 20 -30, 0 0Z"
          fill={leaf2} fillOpacity="0.80" stroke={leaf2} strokeWidth="0.8" />
        <path d="M0 0 C0 -20, 0 -50, 0 -80" stroke={vein} strokeWidth="0.5" opacity="0.35" />
        <path d="M0 -25 C-7 -32, -10 -40, -8 -44" stroke={vein} strokeWidth="0.3" opacity="0.25" />
        <path d="M0 -25 C7 -34, 9 -40, 7 -43" stroke={vein} strokeWidth="0.3" opacity="0.25" />
        <path d="M0 -50 C-8 -58, -10 -64, -9 -67" stroke={vein} strokeWidth="0.3" opacity="0.25" />
      </g>

      {/* Leaf 3 — opposite side of stem */}
      <g transform="translate(80, 75) rotate(50)">
        <path d="M0 0 C-10 -25, 2 -50, 0 -65 C7 -50, 16 -25, 0 0Z"
          fill={leaf3} fillOpacity="0.75" stroke={leaf2} strokeWidth="0.7" />
        <path d="M0 0 C0 -18, 0 -40, 0 -65" stroke={vein} strokeWidth="0.4" opacity="0.3" />
      </g>

      {/* Leaf 4 — along main branch */}
      <g transform="translate(180, 190) rotate(10)">
        <path d="M0 0 C-12 -30, 3 -65, 0 -85 C8 -65, 20 -30, 0 0Z"
          fill={leaf1} fillOpacity="0.70" stroke={leaf1} strokeWidth="0.7" />
        <path d="M0 0 C0 -25, 0 -55, 0 -85" stroke={vein} strokeWidth="0.5" opacity="0.3" />
        <path d="M0 -25 C-8 -33, -11 -42, -9 -46" stroke={vein} strokeWidth="0.3" opacity="0.25" />
        <path d="M0 -25 C8 -35, 10 -42, 8 -45" stroke={vein} strokeWidth="0.3" opacity="0.25" />
      </g>

      {/* Leaf 5 — drooping down from fork */}
      <g transform="translate(110, 210) rotate(70)">
        <path d="M0 0 C-10 -22, 2 -45, 0 -60 C7 -45, 15 -22, 0 0Z"
          fill={leaf2} fillOpacity="0.65" stroke={leaf2} strokeWidth="0.6" />
        <path d="M0 0 C0 -16, 0 -38, 0 -60" stroke={vein} strokeWidth="0.4" opacity="0.25" />
      </g>

      {/* Small accent leaf */}
      <g transform="translate(240, 240) rotate(-25)">
        <path d="M0 0 C-8 -18, 2 -38, 0 -50 C5 -38, 12 -18, 0 0Z"
          fill={leaf3} fillOpacity="0.60" stroke={leaf3} strokeWidth="0.5" />
        <path d="M0 0 C0 -14, 0 -32, 0 -50" stroke={vein} strokeWidth="0.3" opacity="0.2" />
      </g>

      {/* Tiny leaf tip */}
      <g transform="translate(320, 270) rotate(5)">
        <path d="M0 0 C-6 -14, 1 -28, 0 -35 C4 -28, 10 -14, 0 0Z"
          fill={leaf1} fillOpacity="0.55" stroke={leaf1} strokeWidth="0.5" />
      </g>
    </svg>
  );
}

/* ─── Large Branch (right side, middle of page) ─── */
function BranchRight() {
  return (
    <svg width="350" height="500" viewBox="0 0 350 500" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main stem curving from right */}
      <path d="M370 50 C320 80, 260 140, 220 220 C200 280, 190 340, 200 420"
        stroke={stem} strokeWidth="2.8" strokeLinecap="round" fill="none" />
      {/* Secondary branch */}
      <path d="M280 130 C300 170, 310 210, 300 250"
        stroke={stem} strokeWidth="1.8" strokeLinecap="round" fill="none" />

      {/* Big leaf 1 — top right */}
      <g transform="translate(340, 60) rotate(140)">
        <path d="M0 0 C-15 -40, 5 -90, 0 -120 C10 -90, 30 -40, 0 0Z"
          fill={leaf1} fillOpacity="0.85" stroke={leaf1} strokeWidth="0.8" />
        <path d="M0 0 C0 -35, 0 -75, 0 -120" stroke={vein} strokeWidth="0.6" opacity="0.4" />
        <path d="M0 -35 C-9 -45, -13 -55, -11 -60" stroke={vein} strokeWidth="0.4" opacity="0.3" />
        <path d="M0 -35 C9 -47, 11 -55, 9 -58" stroke={vein} strokeWidth="0.4" opacity="0.3" />
        <path d="M0 -70 C-10 -80, -13 -88, -11 -92" stroke={vein} strokeWidth="0.4" opacity="0.3" />
        <path d="M0 -70 C10 -82, 12 -88, 10 -91" stroke={vein} strokeWidth="0.4" opacity="0.3" />
      </g>

      {/* Big leaf 2 */}
      <g transform="translate(300, 140) rotate(170)">
        <path d="M0 0 C-12 -32, 3 -70, 0 -95 C8 -70, 20 -32, 0 0Z"
          fill={leaf2} fillOpacity="0.78" stroke={leaf2} strokeWidth="0.7" />
        <path d="M0 0 C0 -28, 0 -60, 0 -95" stroke={vein} strokeWidth="0.5" opacity="0.35" />
        <path d="M0 -28 C-8 -38, -10 -46, -8 -50" stroke={vein} strokeWidth="0.3" opacity="0.25" />
        <path d="M0 -55 C-9 -64, -11 -72, -9 -75" stroke={vein} strokeWidth="0.3" opacity="0.25" />
      </g>

      {/* Leaf 3 — inner side */}
      <g transform="translate(240, 200) rotate(-30)">
        <path d="M0 0 C-10 -25, 2 -55, 0 -72 C7 -55, 16 -25, 0 0Z"
          fill={leaf3} fillOpacity="0.70" stroke={leaf2} strokeWidth="0.6" />
        <path d="M0 0 C0 -20, 0 -46, 0 -72" stroke={vein} strokeWidth="0.4" opacity="0.28" />
      </g>

      {/* Leaf 4 — lower */}
      <g transform="translate(210, 310) rotate(-60)">
        <path d="M0 0 C-12 -30, 3 -65, 0 -85 C8 -65, 20 -30, 0 0Z"
          fill={leaf1} fillOpacity="0.65" stroke={leaf1} strokeWidth="0.6" />
        <path d="M0 0 C0 -24, 0 -54, 0 -85" stroke={vein} strokeWidth="0.4" opacity="0.25" />
        <path d="M0 -24 C-7 -33, -10 -40, -8 -44" stroke={vein} strokeWidth="0.3" opacity="0.2" />
      </g>

      {/* Small leaf on secondary branch */}
      <g transform="translate(305, 230) rotate(150)">
        <path d="M0 0 C-8 -20, 2 -42, 0 -55 C5 -42, 14 -20, 0 0Z"
          fill={leaf2} fillOpacity="0.60" stroke={leaf2} strokeWidth="0.5" />
        <path d="M0 0 C0 -15, 0 -35, 0 -55" stroke={vein} strokeWidth="0.3" opacity="0.2" />
      </g>

      {/* Tiny tip leaf */}
      <g transform="translate(200, 400) rotate(-40)">
        <path d="M0 0 C-6 -15, 1 -32, 0 -42 C4 -32, 10 -15, 0 0Z"
          fill={leaf3} fillOpacity="0.55" stroke={leaf3} strokeWidth="0.5" />
      </g>
    </svg>
  );
}

/* ─── Small branch (bottom-right corner accent) ─── */
function BranchBottomRight() {
  return (
    <svg width="300" height="320" viewBox="0 0 300 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M310 340 C270 290, 230 240, 180 190 C150 160, 120 140, 80 130"
        stroke={stem} strokeWidth="2.5" strokeLinecap="round" fill="none" />

      <g transform="translate(260, 290) rotate(50)">
        <path d="M0 0 C-14 -35, 4 -80, 0 -105 C9 -80, 26 -35, 0 0Z"
          fill={leaf1} fillOpacity="0.82" stroke={leaf1} strokeWidth="0.8" />
        <path d="M0 0 C0 -30, 0 -65, 0 -105" stroke={vein} strokeWidth="0.5" opacity="0.35" />
        <path d="M0 -30 C-8 -40, -12 -50, -10 -54" stroke={vein} strokeWidth="0.35" opacity="0.25" />
        <path d="M0 -30 C8 -42, 10 -50, 8 -53" stroke={vein} strokeWidth="0.35" opacity="0.25" />
        <path d="M0 -65 C-9 -74, -12 -82, -10 -86" stroke={vein} strokeWidth="0.35" opacity="0.25" />
      </g>

      <g transform="translate(200, 210) rotate(20)">
        <path d="M0 0 C-10 -25, 2 -55, 0 -72 C7 -55, 16 -25, 0 0Z"
          fill={leaf2} fillOpacity="0.72" stroke={leaf2} strokeWidth="0.7" />
        <path d="M0 0 C0 -20, 0 -45, 0 -72" stroke={vein} strokeWidth="0.4" opacity="0.3" />
      </g>

      <g transform="translate(230, 250) rotate(100)">
        <path d="M0 0 C-8 -20, 2 -42, 0 -55 C5 -42, 14 -20, 0 0Z"
          fill={leaf3} fillOpacity="0.65" stroke={leaf3} strokeWidth="0.5" />
        <path d="M0 0 C0 -15, 0 -35, 0 -55" stroke={vein} strokeWidth="0.3" opacity="0.22" />
      </g>

      <g transform="translate(130, 160) rotate(-10)">
        <path d="M0 0 C-6 -15, 1 -32, 0 -42 C4 -32, 10 -15, 0 0Z"
          fill={leaf1} fillOpacity="0.58" stroke={leaf1} strokeWidth="0.5" />
      </g>
    </svg>
  );
}

/* ─── Small accent sprig (mid-left, between sections) ─── */
function SprigLeft() {
  return (
    <svg width="160" height="240" viewBox="0 0 160 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M-10 230 C10 190, 30 150, 50 110 C65 80, 75 50, 80 20"
        stroke={stem} strokeWidth="2" strokeLinecap="round" fill="none" />

      <g transform="translate(30, 150) rotate(-40)">
        <path d="M0 0 C-8 -20, 2 -45, 0 -58 C5 -45, 14 -20, 0 0Z"
          fill={leaf1} fillOpacity="0.75" stroke={leaf1} strokeWidth="0.6" />
        <path d="M0 0 C0 -16, 0 -36, 0 -58" stroke={vein} strokeWidth="0.4" opacity="0.3" />
      </g>

      <g transform="translate(55, 100) rotate(30)">
        <path d="M0 0 C-7 -18, 2 -38, 0 -48 C4 -38, 12 -18, 0 0Z"
          fill={leaf2} fillOpacity="0.68" stroke={leaf2} strokeWidth="0.5" />
        <path d="M0 0 C0 -13, 0 -30, 0 -48" stroke={vein} strokeWidth="0.3" opacity="0.25" />
      </g>

      <g transform="translate(45, 120) rotate(-65)">
        <path d="M0 0 C-6 -14, 1 -30, 0 -40 C4 -30, 10 -14, 0 0Z"
          fill={leaf3} fillOpacity="0.62" stroke={leaf3} strokeWidth="0.5" />
      </g>

      <g transform="translate(72, 55) rotate(15)">
        <path d="M0 0 C-5 -12, 1 -25, 0 -32 C3 -25, 8 -12, 0 0Z"
          fill={leaf1} fillOpacity="0.55" stroke={leaf1} strokeWidth="0.4" />
      </g>
    </svg>
  );
}

/* ─── Tiny floating leaf (single accent) ─── */
function SingleLeaf({ flip }: { flip?: boolean }) {
  return (
    <svg width="80" height="120" viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M40 110 C40 85, 38 60, 40 30" stroke={stem} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M40 30 C25 -5, 38 -15, 40 -5 C42 -15, 55 -5, 40 30Z"
        fill={leaf1} fillOpacity="0.70" stroke={leaf1} strokeWidth="0.6" />
      <path d="M40 30 C40 15, 40 5, 40 -5" stroke={vein} strokeWidth="0.4" opacity="0.3" />
      <path d="M40 15 C34 8, 30 2, 31 -1" stroke={vein} strokeWidth="0.3" opacity="0.2" />
      <path d="M40 15 C46 8, 50 2, 49 -1" stroke={vein} strokeWidth="0.3" opacity="0.2" />
    </svg>
  );
}

/* ── Placement configuration ── */
interface LeafPlacement {
  id: string;
  Component: () => React.JSX.Element;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  rotate: number;
  opacity: number;
  swayClass: string;
  dur: string;
  delay: string;
  hideMobile?: boolean;
}

const placements: LeafPlacement[] = [
  // 1. Large branch — top-left corner, peeking in
  {
    id: "branch-tl",
    Component: BranchTopLeft,
    top: "-40px",
    left: "-60px",
    rotate: 0,
    opacity: 0.65,
    swayClass: "leaf-sway-1",
    dur: "10s",
    delay: "0s",
  },
  // 2. Large branch — right side, mid-page
  {
    id: "branch-r",
    Component: BranchRight,
    top: "28%",
    right: "-80px",
    rotate: 0,
    opacity: 0.55,
    swayClass: "leaf-sway-2",
    dur: "12s",
    delay: "1.5s",
    hideMobile: true,
  },
  // 3. Branch — bottom-right
  {
    id: "branch-br",
    Component: BranchBottomRight,
    bottom: "5%",
    right: "-40px",
    rotate: 0,
    opacity: 0.50,
    swayClass: "leaf-sway-3",
    dur: "9s",
    delay: "3s",
    hideMobile: true,
  },
  // 4. Small sprig — left side between sections
  {
    id: "sprig-l",
    Component: SprigLeft,
    top: "55%",
    left: "-20px",
    rotate: 10,
    opacity: 0.45,
    swayClass: "leaf-sway-1",
    dur: "8s",
    delay: "2s",
  },
  // 5. Single accent leaf — top-right area
  {
    id: "leaf-tr",
    Component: () => <SingleLeaf />,
    top: "12%",
    right: "8%",
    rotate: 25,
    opacity: 0.35,
    swayClass: "leaf-sway-2",
    dur: "7s",
    delay: "4s",
  },
  // 6. Single accent leaf — bottom-left
  {
    id: "leaf-bl",
    Component: () => <SingleLeaf flip />,
    bottom: "15%",
    left: "5%",
    rotate: -20,
    opacity: 0.30,
    swayClass: "leaf-sway-3",
    dur: "9s",
    delay: "5s",
    hideMobile: true,
  },
  // 7. Small floating leaf — mid-right between trust & categories
  {
    id: "leaf-mr",
    Component: () => <SingleLeaf />,
    top: "72%",
    right: "12%",
    rotate: -35,
    opacity: 0.28,
    swayClass: "leaf-sway-1",
    dur: "8s",
    delay: "6s",
    hideMobile: true,
  },
];

export default function FloatingBotanicals() {
  return (
    <div className="botanicals-layer" aria-hidden="true">
      {placements.map((p) => (
        <div
          key={p.id}
          className={`botanical-leaf ${p.swayClass}${p.hideMobile ? " leaf-hide-mobile" : ""}`}
          style={{
            top: p.top,
            bottom: p.bottom,
            left: p.left,
            right: p.right,
            opacity: p.opacity,
            "--base-transform": `rotate(${p.rotate}deg)`,
            "--dur": p.dur,
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: p.delay,
          } as React.CSSProperties}
        >
          <p.Component />
        </div>
      ))}
    </div>
  );
}
