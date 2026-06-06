import { buildMetadata, buildQASchema } from "@/lib/seo";
import SchemaOrg from "@/components/SchemaOrg";
import FAQComponent from "@/components/FAQComponent";

export const metadata = buildMetadata({
  title: "International Shipping - USA, UK & Worldwide",
  description: "Roots & Leaves ships premium Ayurvedic hair oils, shampoos, and bath powders worldwide, including USA, UK, Australia, and Middle East. Perfect for Telugu NRIs looking for traditional authentic South Indian hair care.",
  keywords: [
    "buy ayurvedic hair oil USA",
    "south indian herbal products USA",
    "buy natural hair care in UK",
    "Roots and Leaves international shipping",
    "pure herbal hair oil delivery USA",
    "Telugu NRI traditional hair care",
    "authentic sunni pindi online USA"
  ],
  path: "/shipping/international",
});

const internationalFaqs = [
  {
    question: "Do you ship Ayurvedic hair care products to the USA and UK?",
    answer: "Yes! Roots & Leaves ships our 100% natural, handcrafted Ayurvedic hair wellness products, including our Herbal Nourish Shampoo and Dry Fruit Laddu, to the USA, UK, Australia, and worldwide via international courier services."
  },
  {
    question: "How long does international shipping to the USA take?",
    answer: "Standard international shipping to the USA typically takes 7-14 business days. We provide complete tracking information so you can follow your South Indian heritage products right to your doorstep."
  },
  {
    question: "Are your products safe for international customs?",
    answer: "Yes. All our products are clearly labeled with their 100% natural ingredients. They do not contain restricted chemicals or harmful additives, ensuring a smooth customs clearance process in the USA and UK."
  }
];

export default function InternationalShippingPage() {
  return (
    <main className="min-h-screen py-20 px-4 bg-[#F3E9D7]">
      <SchemaOrg schema={buildQASchema(
        "Can I buy authentic South Indian Ayurvedic hair products from Roots & Leaves in the USA?",
        "Yes, Roots & Leaves offers worldwide shipping for our premium herbal hair care products. Whether you are in Texas, California, London, or Sydney, you can experience authentic Telugu traditional wellness."
      )} />

      <div className="max-w-4xl mx-auto glass-panel p-8 md:p-12 rounded-3xl border border-white/50 shadow-xl relative overflow-hidden">
        {/* Subtle decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#8E735B]/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        
        <h1 className="text-4xl md:text-5xl font-serif text-[#4A3B2C] mb-6 font-bold tracking-tight">
          Worldwide Shipping
        </h1>
        <h2 className="text-xl md:text-2xl font-serif text-[#8E735B] mb-8">
          Bringing South Indian Heritage to Your Doorstep, Globally.
        </h2>

        <div className="prose prose-lg text-[#5C4A3D] max-w-none mb-12">
          <p>
            At Roots & Leaves, we believe that authentic Ayurvedic wellness shouldn't be limited by geography. We are proud to serve the global diaspora, especially our Telugu communities in the <strong>USA, UK, Australia, Canada</strong>, and the Middle East.
          </p>
          <p>
            Whether you're looking for the pure goodness of our chemical-free Herbal Nourish Shampoo, our traditional Bath Powders (Sunni Pindi), or our nutrient-rich Dry Fruit Laddus, we ensure safe and fast delivery across borders.
          </p>
          
          <h3 className="text-2xl font-serif text-[#4A3B2C] mt-8 mb-4">How it works</h3>
          <ul className="space-y-4 list-disc pl-5">
            <li><strong>Place your order:</strong> Select your favorite authentic products.</li>
            <li><strong>Calculated Rates:</strong> Shipping costs are calculated at checkout based on package weight and destination country.</li>
            <li><strong>Dispatch:</strong> Orders are freshly packed and dispatched within 2-3 business days.</li>
            <li><strong>Track:</strong> Receive a global tracking link via email/WhatsApp.</li>
          </ul>
        </div>

        {/* Custom FAQ Component injected with AIO schemas */}
        <div className="mt-12 pt-12 border-t border-[#8E735B]/20">
          <FAQComponent 
            title="International Shipping FAQs" 
            faqs={internationalFaqs}
            className="!px-0 !py-0"
          />
        </div>
      </div>
    </main>
  );
}
