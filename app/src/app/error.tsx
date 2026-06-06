"use client"; // Error components must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 pt-20 pb-20 bg-[#F3E9D7]">
      <h1 className="text-6xl md:text-8xl font-serif text-[#4A3B2C] mb-4 drop-shadow-md">500</h1>
      <h2 className="text-2xl md:text-3xl font-semibold text-[#8E735B] mb-6">Something went wrong!</h2>
      <p className="text-[#5C4A3D] max-w-lg mb-8 leading-relaxed">
        We encountered an unexpected issue while processing your request. Our team has been notified.
      </p>

      <div className="glass-panel p-8 rounded-2xl border border-white/40 mb-10 max-w-2xl w-full text-left">
        <h3 className="text-xl font-serif text-[#4A3B2C] mb-4 font-bold">In the meantime, explore our store:</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <li>
            <Link href="/product/dry-fruit-laddu" className="text-[#8E735B] hover:text-[#4A3B2C] underline decoration-1 underline-offset-4 font-medium transition-colors">
              Authentic Dry Fruit Laddu
            </Link>
          </li>
          <li>
            <Link href="/product/herbal-nourish-shampoo" className="text-[#8E735B] hover:text-[#4A3B2C] underline decoration-1 underline-offset-4 font-medium transition-colors">
              Premium Herbal Nourish Shampoo
            </Link>
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={() => reset()}
          className="bg-[#4A3B2C] hover:bg-[#32281D] text-white shadow-lg"
        >
          Try again
        </Button>
        <Link href="/">
          <Button variant="outline" className="border-[#8E735B] text-[#4A3B2C] hover:bg-[#8E735B] hover:text-white transition-colors">
            Return Home
          </Button>
        </Link>
      </div>
    </main>
  );
}
