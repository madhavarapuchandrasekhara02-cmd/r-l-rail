"use client";
import React from "react";

/**
 * SectionDivider — Luxury ornamental divider between homepage sections.
 * Renders: ──── ✦ ──── pattern with sacred temple-inspired flourish.
 */

export default function SectionDivider() {
  return (
    <div
      className="flex items-center justify-center py-[10px]"
      style={{
        margin: "0 auto",
        maxWidth: "100%",
        opacity: 0.6, // Slightly increased opacity for the premium gold texture
      }}
      aria-hidden="true"
    >
      <img
        src="/section-divider.webp"
        alt="Section Divider"
        className="w-full max-w-[180px] md:max-w-[400px] h-auto object-contain"
      />
    </div>
  );
}
