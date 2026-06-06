"use client";
import React from "react";

/**
 * OrnamentalBorders — Global left/right framing borders
 * Style and pattern are managed via background-image in index.css
 */
export default function OrnamentalBorders() {
  return (
    <>
      <div className="ornamental-border ornamental-border--left" aria-hidden="true" />
      <div className="ornamental-border ornamental-border--right" aria-hidden="true" />
    </>
  );
}
