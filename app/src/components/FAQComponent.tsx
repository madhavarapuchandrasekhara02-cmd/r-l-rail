"use client";

import React, { useState } from "react";
import SchemaOrg from "./SchemaOrg";
import { buildFAQSchema } from "@/lib/seo";
import { ChevronDown } from "lucide-react";

export interface FAQ {
  question: string;
  answer: string;
}

interface FAQComponentProps {
  faqs: FAQ[];
  title?: string;
  className?: string;
}

export default function FAQComponent({ faqs, title = "Frequently Asked Questions", className = "" }: FAQComponentProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className={`py-12 w-full max-w-4xl mx-auto px-4 ${className}`}>
      {/* AIO: Injecting the FAQ Schema for search engines like Google and AI engines */}
      <SchemaOrg schema={buildFAQSchema(faqs)} />

      <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-8 text-[#4A3B2C]">
        {title}
      </h2>

      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="glass-panel overflow-hidden transition-all duration-300"
              style={{
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.4)",
              }}
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex justify-between items-center p-5 text-left bg-white/40 hover:bg-white/60 transition-colors focus:outline-none focus:ring-2 focus:ring-[#8E735B]"
                aria-expanded={isOpen}
              >
                <h3 className="font-semibold text-[#4A3B2C] text-lg pr-4">{faq.question}</h3>
                <ChevronDown
                  className={`w-5 h-5 text-[#8E735B] transition-transform duration-300 flex-shrink-0 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="p-5 text-[#5C4A3D] leading-relaxed border-t border-white/20">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
