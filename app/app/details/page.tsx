'use client';

import { useState } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/10">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-lg md:text-xl font-medium group-hover:text-white/80 transition-colors">{question}</span>
        <span className={`text-2xl transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>+</span>
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[500px] pb-8' : 'max-h-0'}`}>
        <p className="text-[#666] leading-relaxed max-w-2xl text-sm md:text-base">
          {answer}
        </p>
      </div>
    </div>
  );
}

export default function DetailsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-white selection:text-black">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="section-container pt-24 pb-12 md:pt-32 md:pb-16">
          <header className="max-w-4xl relative">
            <div className="mb-6 animate-fade-in">
              <Image src="/logo/logo_icon_white.svg" alt="Circuit" width={38} height={38} className="brightness-110" />
            </div>
            <span className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-[#666] mb-4 block animate-fade-in">
              The Circuit Philosophy
            </span>
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight leading-[0.95] mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              We only create <br />
              what is earned.
            </h1>
            <p className="text-base md:text-xl text-[#888] leading-relaxed max-w-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Circuit is an anti-overproduction protocol for luxury fashion. We use the Solana blockchain to ensure that every garment in existence is born from a confirmed request—never a prediction.
            </p>
          </header>
        </section>

        {/* The Protocol Breakdown */}
        <section className="bg-white/[0.02] border-y border-white/[0.06] py-12 md:py-16">
          <div className="section-container grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-2xl font-bold mb-6">The Birth Certificate Model</h2>
              <div className="space-y-5">
                <div className="flex gap-5">
                  <span className="text-[0.65rem] font-mono text-[#444] mt-1">01</span>
                  <div>
                    <h4 className="text-base font-bold mb-1">Atomic Escrow</h4>
                    <p className="text-xs text-[#666] leading-relaxed">Your payment is locked on-chain immediately. It is secured by code and only released to the designer once you confirm delivery.</p>
                  </div>
                </div>
                <div className="flex gap-5">
                  <span className="text-[0.65rem] font-mono text-[#444] mt-1">02</span>
                  <div>
                    <h4 className="text-base font-bold mb-1">Digital Birth</h4>
                    <p className="text-xs text-[#666] leading-relaxed">Unlike standard NFTs, a Circuit Passport is minted the moment the first cut of fabric is made. The digital and physical objects are inseparable.</p>
                  </div>
                </div>
                <div className="flex gap-5">
                  <span className="text-[0.65rem] font-mono text-[#444] mt-1">03</span>
                  <div>
                    <h4 className="text-base font-bold mb-1">Proven Identity</h4>
                    <p className="text-xs text-[#666] leading-relaxed">By scanning the physical tag sewn into your garment, you reveal its entire provenance—from the designer's hands to your doorstep.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="card-glass overflow-hidden relative aspect-[4/5] max-h-[500px] mx-auto">
                <Image src="/satin.png" alt="3 Piece Agbada" fill className="object-cover scale-[1.02]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <h3 className="text-2xl font-bold tracking-tighter">Verified Origin.</h3>
                  <p className="text-white/60 text-[0.6rem] mt-1 font-mono tracking-widest uppercase">Series Zero Collection</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="section-container py-12 md:py-16" id="faq">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">FAQ</h2>
              <p className="text-[#666] mt-2 text-xs leading-relaxed max-w-xs">
                Common questions regarding our production model, escrow security, and digital passports.
              </p>
            </div>
            <div className="lg:col-span-2">
              <FAQItem 
                question="How does the escrow protect my funds?" 
                answer="When you place an order, your SOL is locked into a Solana smart contract. The designer can see the funds are there but cannot withdraw them. Only after you receive the physical item and scan the QR code to confirm delivery are the funds released."
              />
              <FAQItem 
                question="What is a Garment Passport?" 
                answer="It is a Digital Birth Certificate (NFT) that is unique to your specific piece. It contains the fabric details, the date of production, and proof of authenticity. It is sewn into your garment via a physical QR tag."
              />
              <FAQItem 
                question="Do I need a crypto wallet to use Circuit?" 
                answer="No. We use 'Invisible Blockchain' technology. You can sign in with your email, and we provision a secure vault for your digital assets in the background."
              />
              <FAQItem 
                question="Why is there a supply cap?" 
                answer="To maintain the highest level of craftsmanship and eliminate waste, each drop has a maximum capacity. Once the cap is reached, the drop closes and the next collection is prepared."
              />
              <FAQItem 
                question="How do I verify a garment I bought elsewhere?" 
                answer="Every authentic Circuit garment has a unique QR code sewn into the interior tag. Scanning this code will always open its official Digital Passport on our platform."
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="section-container pb-16">
          <div className="card-glass p-10 md:p-16 text-center overflow-hidden relative">
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#fff_0%,_transparent_70%)]" />
             <div className="relative z-10">
               <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tighter text-white">Join the Next Drop.</h2>
               <p className="text-[#666] mb-12 max-w-md mx-auto">
                 Don't miss out on Series One. Enter your email to be notified when the next window opens.
               </p>
               <div className="flex flex-col md:flex-row gap-4 justify-center items-center max-w-md mx-auto">
                 <input 
                   type="email" 
                   placeholder="Enter email address" 
                   className="w-full bg-white/[0.05] border border-white/10 px-6 py-4 rounded-full text-sm focus:outline-none focus:border-white/30 transition-all"
                 />
                 <button className="btn-circuit w-full md:w-auto justify-center whitespace-nowrap">
                   <span>Notify Me</span>
                 </button>
               </div>
             </div>
          </div>
        </section>
      </main>
    </div>
  );
}
