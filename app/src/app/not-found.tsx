import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Page Not Found | Roots & Leaves",
  description: "The page you are looking for does not exist. Discover our premium Ayurvedic hair oils and herbal wellness products.",
  // We keep it indexed so that Google doesn't punish the domain for 404s, but instead crawls the inner links
  robots: { index: true, follow: true },
};

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 pt-20 pb-20 bg-[#F3E9D7]">
      <h1 className="text-6xl md:text-8xl font-serif text-[#4A3B2C] mb-4 drop-shadow-md">404</h1>
      <h2 className="text-2xl md:text-3xl font-semibold text-[#8E735B] mb-6">Oops! We lost this leaf in the wind.</h2>
      <p className="text-[#5C4A3D] max-w-lg mb-8 leading-relaxed">
        The page you are looking for might have been moved or no longer exists. 
        But don't worry, your journey to 100% natural Ayurvedic wellness doesn't end here!
      </p>

      <div className="glass-panel p-8 rounded-2xl border border-white/40 mb-10 max-w-2xl w-full text-left">
        <h3 className="text-xl font-serif text-[#4A3B2C] mb-4 font-bold">Discover our Best-Sellers:</h3>
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
          <li>
            <Link href="/product/chia-seeds" className="text-[#8E735B] hover:text-[#4A3B2C] underline decoration-1 underline-offset-4 font-medium transition-colors">
              Organic Chia Seeds
            </Link>
          </li>
          <li>
            <Link href="/shop" className="text-[#8E735B] hover:text-[#4A3B2C] underline decoration-1 underline-offset-4 font-medium transition-colors">
              All Ayurvedic Hair Care
            </Link>
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/">
          <Button className="bg-[#4A3B2C] hover:bg-[#32281D] text-white shadow-lg">
            Return Home
          </Button>
        </Link>
        <Link href="/shop">
          <Button variant="outline" className="border-[#8E735B] text-[#4A3B2C] hover:bg-[#8E735B] hover:text-white transition-colors">
            Shop Herbal Rituals
          </Button>
        </Link>
      </div>
    </main>
  );
}
