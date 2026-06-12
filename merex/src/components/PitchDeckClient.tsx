"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, BarChart3, Users, Zap, DollarSign, Target, ShieldCheck } from "lucide-react";

type Slide = {
  id: string;
  title?: string;
  content: React.ReactNode;
  bg?: string;
};

const slides: Slide[] = [
  {
    id: "slide-1-title",
    bg: "bg-[#0A0A0A]",
    content: (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="inline-flex h-20 items-center justify-center rounded-2xl bg-white text-black px-12 text-6xl font-black tracking-tighter mb-8 font-tilt">
            merex
          </div>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6"
        >
          The Operating System for <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
            Creator-Brand Collaborations
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-stone-400 max-w-3xl font-mono"
        >
          Programmable fame. Automate 1000s of micro-influencers and clippers without the micro-management.
        </motion.p>
      </div>
    ),
  },
  {
    id: "slide-2-problem",
    bg: "bg-[#111]",
    title: "The Opportunity & The Problem",
    content: (
      <div className="flex flex-col md:flex-row h-full items-center justify-center gap-12 max-w-6xl mx-auto px-8">
        <div className="flex-1 space-y-8">
          <motion.h2
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-6xl font-bold text-white tracking-tight"
          >
            The Shift to <br />
            <span className="text-orange-400">Micro-Creators.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-stone-400 leading-relaxed"
          >
            Brands are shifting their focus to micro-creators and content clipping to generate genuine organic marketing. But the market is completely opaque.
          </motion.p>
        </div>
        <div className="flex-1 grid grid-cols-1 gap-6">
          {[
            { icon: Users, title: "No Open Market", text: "Zero transparent dealing between brands and creators.", color: "text-orange-400", bg: "bg-orange-400/10" },
            { icon: Target, title: "The Middleman", text: "The market is unorganized into agencies and PR groups.", color: "text-blue-400", bg: "bg-blue-400/10" },
            { icon: ShieldCheck, title: "Zero Authenticity Checks", text: "Brands fly blind without real verification of influence.", color: "text-red-400", bg: "bg-red-400/10" }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="p-6 rounded-2xl bg-stone-900 border border-stone-800 flex items-center gap-6"
            >
              <div className={`p-4 rounded-xl ${item.bg} flex-shrink-0`}>
                <item.icon className={`w-8 h-8 ${item.color}`} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                <p className="text-stone-400 font-medium">{item.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "slide-3-market",
    bg: "bg-[#0A0A0A]",
    title: "Market Size",
    content: (
      <div className="flex flex-col items-center justify-center h-full max-w-5xl mx-auto px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-6xl font-bold text-white mb-8"
        >
          A <span className="text-emerald-400">$1 Trillion</span> Market
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl text-stone-400 mb-16 max-w-3xl leading-relaxed"
        >
          The creator economy is projected to exceed $1 Trillion by 2033. Micro-influencers and organic UGC clipping are becoming the primary driver of digital marketing spend.
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {[
            { value: "> 22%", label: "CAGR Growth Rate" },
            { value: "2-3x", label: "Higher Engagement for Micro-creators" },
            { value: "No. 1", label: "Shift toward 'Authenticity-as-a-service'" }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className="p-8 rounded-3xl bg-stone-900 border border-stone-800 text-center"
            >
              <h3 className="text-5xl font-black text-white mb-4">{item.value}</h3>
              <p className="text-stone-400 font-medium text-lg">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "slide-4-solution",
    bg: "bg-white",
    title: "The Solution & Moat",
    content: (
      <div className="flex flex-col md:flex-row h-full items-center justify-center gap-16 max-w-6xl mx-auto px-8">
        <div className="flex-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block px-4 py-1.5 rounded-full bg-orange-100 text-orange-800 font-bold text-sm tracking-wide mb-4"
          >
            NOT A FREELANCE SITE
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl md:text-6xl font-black text-black tracking-tight leading-[1.1]"
          >
            AI-Powered Programmable Fame
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl text-stone-600 leading-relaxed"
          >
            You don't come here searching for a single influencer. You come here to program an ecosystem.
          </motion.p>
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4 pt-4 text-lg text-stone-800 font-medium"
          >
            <li className="flex items-center gap-3"><span className="text-orange-500 font-bold text-xl">✓</span> Command 1,000s of micro-influencers & clippers</li>
            <li className="flex items-center gap-3"><span className="text-orange-500 font-bold text-xl">✓</span> Eliminate micro-management completely</li>
            <li className="flex items-center gap-3"><span className="text-orange-500 font-bold text-xl">✓</span> Only pay for validated authentic deliverables</li>
          </motion.ul>
        </div>
        <div className="flex-1 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: 2 }}
            animate={{ opacity: 1, y: 0, rotate: -1 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="w-full h-[400px] bg-stone-100 border-4 border-black rounded-3xl shadow-[12px_12px_0px_rgba(0,0,0,1)] p-6 flex flex-col relative overflow-hidden"
          >
            <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-4">
              <h3 className="font-bold text-xl text-black">Campaign OS</h3>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400 border border-black"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400 border border-black"></div>
                <div className="w-3 h-3 rounded-full bg-green-400 border border-black"></div>
              </div>
            </div>
            <div className="space-y-4 flex-1">
              {[
                { title: "Scale UGC Production", metrics: "450 creators deployed", status: "Active" },
                { title: "TikTok Clipping Swarm", metrics: "1.2M organic impressions", status: "Scaling" },
                { title: "Micro-Influencer Blitz", metrics: "Verifying authenticity...", status: "Processing" }
              ].map((item, i) => (
                <div key={i} className="p-4 border-2 border-black bg-white rounded-xl flex justify-between items-center">
                  <div>
                    <div className="font-bold text-black mb-1">{item.title}</div>
                    <div className="text-xs text-stone-500 font-mono">{item.metrics}</div>
                  </div>
                  <div className="font-bold bg-black text-white px-3 py-1 rounded-full border border-black text-sm">
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    ),
  },
  {
    id: "slide-5-business",
    bg: "bg-[#0A0A0A]",
    title: "Business Model",
    content: (
      <div className="flex flex-col items-center justify-center h-full max-w-5xl mx-auto px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold text-white mb-6"
        >
          How Merex Makes Money
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-stone-400 max-w-2xl mb-16"
        >
          A simple, transparent pricing model that aligns our success with the success of our users.
        </motion.p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-10 rounded-3xl bg-stone-900 border border-stone-800 text-left"
          >
            <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6">
              <BarChart3 size={28} />
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">Campaign Fees</h3>
            <p className="text-stone-400 text-lg mt-4 leading-relaxed">
              We charge transaction fees on successful campaigns, ensuring we only make money when creators and brands successfully collaborate.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-10 rounded-3xl bg-gradient-to-br from-orange-500/20 to-amber-500/5 border border-orange-500/30 text-left relative overflow-hidden"
          >
            <div className="absolute top-6 right-6 px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs font-bold tracking-widest border border-orange-500/30">
              COMING SOON
            </div>
            <div className="w-14 h-14 bg-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center mb-6">
              <Zap size={28} />
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">SaaS Subscriptions</h3>
            <p className="text-stone-300 text-lg mt-4 leading-relaxed">
              Future recurring subscriptions unlocking certain niche features, advanced automation, and priority matching capabilities.
            </p>
          </motion.div>
        </div>
      </div>
    ),
  },
  {
    id: "slide-6-traction",
    bg: "bg-[#111]",
    title: "The Ask",
    content: (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring" }}
          className="w-24 h-24 bg-white text-black rounded-full flex items-center justify-center mb-8"
        >
          <ArrowRight size={40} />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8"
        >
          Join The Open Market
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl text-stone-400 mb-12 leading-relaxed"
        >
          We are seeking Strategic Partners and VCs to accelerate brand onboarding and build the infrastructure for programmable fame.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <a
            href="/early-access"
            className="inline-flex items-center justify-center px-8 py-4 text-xl font-bold bg-white text-black rounded-full hover:scale-105 transition-transform"
          >
            Let's Talk
          </a>
        </motion.div>
      </div>
    ),
  }
];

export default function PitchDeckClient() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((prev) => prev - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Space" || e.key === "Enter") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95
    })
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden select-none">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
            scale: { duration: 0.4 }
          }}
          className={`absolute inset-0 w-full h-full ${slides[currentSlide].bg}`}
        >
          {currentSlide > 0 && slides[currentSlide].title && (
            <div className="absolute top-8 left-12 text-sm font-bold tracking-widest uppercase text-stone-500 opacity-60">
              {slides[currentSlide].title}
            </div>
          )}

          {slides[currentSlide].content}
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/10 z-50">
        <motion.div 
          className="h-full bg-orange-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="absolute bottom-8 right-12 z-50 flex items-center gap-4">
        <div className="text-white/40 font-mono text-sm mr-4">
          {currentSlide + 1} / {slides.length}
        </div>
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 transition-transform shadow-lg"
        >
          <ArrowRight size={20} />
        </button>
      </div>

      <div className="absolute top-8 right-12 z-50 opacity-30 mix-blend-difference pointer-events-none">
        <div className="font-tilt text-2xl text-white font-bold">merex</div>
      </div>
    </div>
  );
}
