"use client";
import dynamic from 'next/dynamic';

const Checkout = dynamic(() => import("@/views/Checkout"), {
  ssr: false,
});

export default function Page() {
  return <Checkout />;
}
