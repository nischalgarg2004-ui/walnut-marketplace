"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, useInView, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from "framer-motion";
import {
  ArrowRight, CheckCircle2, Users, Zap,
  DollarSign, Shield, Eye, ChevronDown, Play, Star,
  TrendingUp, Globe, Target, Layers, MessageSquare, Upload,
  Banknote, BarChart2, Lock, Sparkles, Mail, ArrowUp
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   LENIS SMOOTH SCROLL
   ═══════════════════════════════════════════════════════════ */
function useLenis() {
  useEffect(() => {
    let lenis: any;
    (async () => {
      try {
        const Lenis = (await import("lenis")).default;
        lenis = new Lenis({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
        });
        function raf(time: number) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      } catch {}
    })();
    return () => { if (lenis) lenis.destroy(); };
  }, []);
}

/* ═══════════════════════════════════════════════════════════
   REUSABLE: REVEAL ON SCROLL
   ═══════════════════════════════════════════════════════════ */
function Reveal({
  children, delay = 0, direction = "up", className = "",
}: {
  children: React.ReactNode; delay?: number;
  direction?: "up" | "left" | "right" | "none"; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  const initial =
    direction === "up" ? { opacity: 0, y: 40 }
    : direction === "left" ? { opacity: 0, x: -40 }
    : direction === "right" ? { opacity: 0, x: 40 }
    : { opacity: 0 };
  return (
    <motion.div ref={ref} className={className}
      initial={initial}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : initial}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >{children}</motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REUSABLE: ANIMATED COUNTER
   ═══════════════════════════════════════════════════════════ */
function Counter({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0; const dur = 1600; const step = end / (dur / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(t); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [inView, end]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════
   REUSABLE: SECTION TAG
   ═══════════════════════════════════════════════════════════ */
function Tag({ label, color = "orange" }: { label: string; color?: string }) {
  const c: Record<string, string> = {
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.15em] border uppercase font-geist-custom ${c[color] || c.orange}`}>
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   GRADIENT DIVIDER
   ═══════════════════════════════════════════════════════════ */
function GradientDivider() {
  return (
    <div className="w-full h-px bg-gradient-to-r from-transparent via-stone-700/50 to-transparent" />
  );
}

/* ═══════════════════════════════════════════════════════════
   CAMPAIGN CARD (hover glow)
   ═══════════════════════════════════════════════════════════ */
function CampaignCard({ type, niche, budget, creators, delay: d }: {
  type: string; niche: string; budget: string; creators: string; delay: number;
}) {
  const typeC: Record<string, string> = {
    "UGC Barter": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "One-Time Pay": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Per-View Clip": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  return (
    <Reveal delay={d} direction="up">
      <div className="rounded-2xl bg-stone-900 border border-stone-800 p-5 hover:border-stone-600 hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-transparent to-amber-500/0 group-hover:from-orange-500/[0.03] group-hover:to-amber-500/[0.03] transition-all duration-500 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${typeC[type] || ""}`}>{type}</span>
            <span className="text-sm font-bold text-white font-geist-custom">{budget}</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-stone-400">
              <Target size={12} className="text-orange-400" />
              <span>Niche: <span className="text-stone-300 font-medium">{niche}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-stone-400">
              <Users size={12} className="text-orange-400" />
              <span>{creators}</span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {["Fashion", "Female", "10K-100K"].map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-500 text-[10px] font-medium font-geist-custom">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ═══════════════════════════════════════════════════════════
   REVIEW MOCKUP (frame.io style)
   ═══════════════════════════════════════════════════════════ */
function ReviewMockup() {
  const [active, setActive] = useState(0);
  const comments = [
    { x: "28%", y: "35%", text: "Logo placement looks great", author: "Brand" },
    { x: "62%", y: "58%", text: "Lighting could be brighter here", author: "Brand" },
    { x: "45%", y: "72%", text: "CTA text needs to be larger", author: "Brand" },
  ];
  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % comments.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-2xl bg-[#111] border border-stone-800 overflow-hidden shadow-2xl shadow-black/40">
      {/* toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-stone-900/80 border-b border-stone-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>
        <div className="flex-1 text-center text-xs text-stone-500 font-geist-custom">summer_skincare_v2.mp4</div>
        <div className="flex items-center gap-1.5">
          <Lock size={11} className="text-orange-400" />
          <span className="text-[10px] text-orange-400 font-bold font-geist-custom">WATERMARKED</span>
        </div>
      </div>
      {/* video area */}
      <div className="relative bg-stone-950 h-52 md:h-64">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-800/60 via-stone-900 to-stone-950 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <Play size={20} className="text-white ml-0.5" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none">
            <div className="text-white text-4xl font-black tracking-[0.3em] rotate-[-25deg]">MEREX</div>
          </div>
        </div>
        {/* scrub timeline */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent flex items-end px-3 pb-2 gap-1.5">
          <div className="flex-1 h-1 bg-stone-700 rounded-full overflow-hidden">
            <motion.div className="h-full bg-orange-500 rounded-full" animate={{ width: ["0%", "65%"] }} transition={{ duration: 8, repeat: Infinity }} />
          </div>
          <span className="text-[9px] text-stone-500 font-geist-custom">0:14 / 0:22</span>
        </div>
        {/* comment pins */}
        {comments.map((c, i) => (
          <motion.div key={i} style={{ left: c.x, top: c.y }} className="absolute"
            animate={{ scale: active === i ? 1.4 : 1, opacity: active === i ? 1 : 0.5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black ${active === i ? "bg-orange-500 shadow-lg shadow-orange-500/40" : "bg-stone-600"}`}>
              {i + 1}
            </div>
          </motion.div>
        ))}
      </div>
      {/* comment panel */}
      <div className="px-4 py-3 border-t border-stone-800">
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
            className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-[10px] font-bold text-orange-400 flex-shrink-0">B</div>
            <div>
              <div className="text-[10px] text-stone-600 mb-0.5 font-geist-custom">{comments[active].author} · just now</div>
              <div className="text-sm text-stone-200">{comments[active].text}</div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAYOUT FLOW STEP
   ═══════════════════════════════════════════════════════════ */
function PayoutStep({ step, icon: Icon, title, desc, delay: d, active }: {
  step: string; icon: React.ElementType; title: string; desc: string; delay: number; active?: boolean;
}) {
  return (
    <Reveal delay={d} direction="up">
      <div className="relative flex gap-5 pb-10 last:pb-0">
        <div className="flex flex-col items-center">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors ${active ? "bg-orange-500 border-orange-400 shadow-lg shadow-orange-500/20" : "bg-stone-900 border-stone-700"}`}>
            <Icon size={18} className={active ? "text-white" : "text-stone-400"} />
          </div>
          <div className="w-px flex-1 bg-stone-800 mt-2" />
        </div>
        <div className="pt-2">
          <div className="text-[10px] font-bold text-stone-600 mb-1 font-geist-custom">{step}</div>
          <h4 className={`font-bold text-base mb-1 ${active ? "text-white" : "text-stone-300"}`}>{title}</h4>
          <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
        </div>
      </div>
    </Reveal>
  );
}

/* ═══════════════════════════════════════════════════════════
   DOT NAV (right side)
   ═══════════════════════════════════════════════════════════ */
const SECTIONS = [
  { id: "hero", label: "" },
  { id: "oneliner", label: "" },
  { id: "problem", label: "Problem" },
  { id: "whynow", label: "Why Now" },
  { id: "market", label: "Market" },
  { id: "solution", label: "Solution" },
  { id: "product", label: "Product" },
  { id: "moat", label: "Moat" },
  { id: "model", label: "Model" },
  { id: "gtm", label: "GTM" },
  { id: "ask", label: "The Ask" },
];

function DotNav({ activeIdx }: { activeIdx: number }) {
  return (
    <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-2.5 items-end">
      {SECTIONS.filter(s => s.label).map((s, i) => {
        const realIdx = SECTIONS.findIndex(x => x.id === s.id);
        const isActive = activeIdx === realIdx;
        return (
          <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 group" title={s.label}>
            <span className={`text-[10px] font-geist-custom transition-all duration-300 ${isActive ? "opacity-100 text-orange-400 translate-x-0" : "opacity-0 text-stone-500 translate-x-2 group-hover:opacity-70 group-hover:translate-x-0"}`}>
              {s.label}
            </span>
            <span className={`block rounded-full transition-all duration-300 ${isActive ? "w-3 h-3 bg-orange-400 shadow-sm shadow-orange-400/40" : "w-1.5 h-1.5 bg-stone-700 group-hover:bg-stone-500"}`} />
          </a>
        );
      })}
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function PitchDeckScroll() {
  useLenis();

  const { scrollYProgress } = useScroll();
  const [scrollPct, setScrollPct] = useState(0);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setScrollPct(v * 100);
    setShowBackToTop(v > 0.1);
  });

  // Track which section is in view
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const setSectionRef = useCallback((idx: number) => (el: HTMLElement | null) => {
    sectionRefs.current[idx] = el;
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = sectionRefs.current.indexOf(entry.target as HTMLElement);
            if (idx !== -1) setActiveSectionIdx(idx);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );
    sectionRefs.current.forEach((ref) => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, []);

  // Hero parallax
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 700], [0, -150]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const gridY = useTransform(scrollY, [0, 700], [0, -40]);

  return (
    <div className="bg-[#0A0A0A] text-white overflow-x-hidden font-sans relative">

      {/* ═══ GRAIN OVERLAY ═══ */}
      <div className="pointer-events-none fixed inset-0 z-[60] opacity-[0.015]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat", backgroundSize: "128px 128px" }} />

      {/* ═══ SCROLL PROGRESS BAR ═══ */}
      <div className="fixed top-0 left-0 w-full h-[2px] z-[55] bg-stone-900/50">
        <motion.div className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500"
          style={{ width: `${scrollPct}%` }}
          transition={{ duration: 0.05 }} />
      </div>

      {/* ═══ DOT NAV ═══ */}
      <DotNav activeIdx={activeSectionIdx} />

      {/* ═══════════════════════════════════════════════════════
         1. HERO
         ═══════════════════════════════════════════════════════ */}
      <section ref={setSectionRef(0)} id="hero" className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* grid bg - parallax */}
        <motion.div style={{ y: gridY }} className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        {/* glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-orange-500/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[200px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-400 text-sm font-semibold mb-8 font-geist-custom">
            <Sparkles size={14} />
            Seed Round · India · 2026
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl md:text-[7rem] font-black tracking-[-0.04em] leading-[0.95] mb-8">
            <span className="text-white">Programmable</span><br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-300">Fame.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-stone-400 max-w-3xl mx-auto leading-relaxed mb-12">
            The operating system for creator-brand collaborations. Scale 1,000s of micro-influencers and clippers. Zero micro-management.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap gap-4 justify-center">
            <a href="mailto:nischal@ongram.in"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-black font-bold rounded-full text-base hover:scale-[1.04] transition-transform shadow-xl shadow-white/5">
              Connect With Us <ArrowRight size={18} />
            </a>
            <a href="#problem"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/[0.04] border border-white/10 text-white font-semibold rounded-full text-base hover:bg-white/[0.08] transition-colors">
              Read the Deck <ChevronDown size={18} />
            </a>
          </motion.div>
        </motion.div>

        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-stone-700">
          <ChevronDown size={24} />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         2. ONE-LINER (Pattern interrupt)
         ═══════════════════════════════════════════════════════ */}
      <GradientDivider />
      <section ref={setSectionRef(1)} id="oneliner" className="py-24 md:py-32 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <p className="text-3xl md:text-[3.5rem] font-black text-white leading-[1.15] tracking-tight">
              Influencer marketing is <span className="text-stone-600 line-through decoration-stone-700">broken</span>.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">There is no open market.</span>
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-8 text-lg md:text-xl text-stone-500 max-w-2xl mx-auto leading-relaxed">
              Brands and creators are trapped in a maze of opaque agencies, PR gatekeepers, and ghost DMs—with no transparency, no authenticity checks, and no guarantee of results.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         3. PROBLEM
         ═══════════════════════════════════════════════════════ */}
      <GradientDivider />
      <section ref={setSectionRef(2)} id="problem" className="py-24 md:py-36 px-6 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <Reveal><Tag label="01 — The Problem" /></Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 text-4xl md:text-[3.8rem] font-black leading-[1.1] tracking-tight max-w-3xl">
              $200 billion market.<br />Zero infrastructure.
            </h2>
          </Reveal>

          <div className="mt-20 grid md:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: "No Open Market", desc: "No transparent platform for direct deals. Everything runs through DM chains, agencies, and PR groups.", color: "text-orange-400", bg: "bg-orange-500/[0.04] border-orange-500/10" },
              { icon: Shield, title: "Zero Authenticity", desc: "Brands pay premium with no verification of real followers, engagement quality, or content relevance. Fake influence is rampant.", color: "text-red-400", bg: "bg-red-500/[0.04] border-red-500/10" },
              { icon: DollarSign, title: "Payment Chaos", desc: "Creators wait 60–90 days for payments. Brands get off-brief content. No escrow. No contract enforcement. No accountability.", color: "text-amber-400", bg: "bg-amber-500/[0.04] border-amber-500/10" },
            ].map((item, i) => (
              <Reveal key={i} delay={0.1 * i} direction="up">
                <div className={`p-7 rounded-2xl border ${item.bg} h-full`}>
                  <item.icon size={28} className={`${item.color} mb-5`} />
                  <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-stone-500 leading-relaxed text-[15px]">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3}>
            <div className="mt-20 rounded-3xl bg-stone-900/50 border border-stone-800 p-10 md:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/[0.04] via-transparent to-amber-500/[0.04] pointer-events-none" />
              <p className="text-2xl md:text-4xl font-black text-white leading-snug relative z-10">
                "The market is controlled by gatekeepers.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">We tear down the gate."</span>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ INTERRUPTIVE STAT ═══════════ */}
      <section className="py-16 md:py-24 px-6 bg-[#0A0A0A]">
        <Reveal>
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-6xl md:text-[8rem] font-black tracking-[-0.04em] leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-stone-600">
              $200B+
            </p>
            <p className="mt-4 text-lg md:text-xl text-stone-600 font-geist-custom">
              creator economy — growing 22%+ CAGR — and no one built the rails.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════
         4. WHY NOW
         ═══════════════════════════════════════════════════════ */}
      <GradientDivider />
      <section ref={setSectionRef(3)} id="whynow" className="py-24 md:py-36 px-6 bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto">
          <Reveal><Tag label="02 — Why Now" color="amber" /></Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 text-4xl md:text-[3.8rem] font-black tracking-tight max-w-3xl leading-[1.1]">
              Megaphones are dead.<br /><span className="text-amber-400">Whispers convert.</span>
            </h2>
          </Reveal>

          <div className="mt-16 grid md:grid-cols-2 gap-8 md:gap-14 items-center">
            <div className="space-y-10">
              {[
                { stat: "73%", desc: "of brands now prefer micro-creator campaigns over celebrity endorsements for conversion." },
                { stat: "2–3×", desc: "higher engagement rates from micro-creators (10K–100K followers) vs. macro-influencers." },
                { stat: "$1T", desc: "creator economy projected to reach $1 Trillion by 2033. The rails don't exist yet." },
              ].map((item, i) => (
                <Reveal key={i} delay={0.1 * i} direction="left">
                  <div className="flex gap-6 items-start">
                    <div className="text-4xl md:text-5xl font-black text-amber-400 tabular-nums flex-shrink-0 min-w-[5rem]">{item.stat}</div>
                    <p className="text-stone-400 text-lg leading-relaxed pt-1">{item.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.2} direction="right">
              <div className="rounded-2xl bg-stone-900/60 border border-stone-800 p-8 space-y-5">
                <div className="text-sm font-bold text-stone-600 uppercase tracking-[0.15em] font-geist-custom">The New Playbook</div>
                {[
                  "Stop chasing 1 mega-influencer with 10M followers",
                  "Deploy 500 micro-creators in parallel",
                  "Add clippers to turn every asset into organic reach",
                  "Authentic social proof → conversions at scale",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-1" />
                    <span className="text-stone-300 text-[15px]">{item}</span>
                  </div>
                ))}
                <div className="pt-4 border-t border-stone-800 text-sm text-stone-600 font-geist-custom">
                  Merex is purpose-built for this playbook.
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         5. MARKET SIZE
         ═══════════════════════════════════════════════════════ */}
      <GradientDivider />
      <section ref={setSectionRef(4)} id="market" className="py-24 md:py-36 px-6 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <Reveal><Tag label="03 — Market Size" color="emerald" /></Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 text-4xl md:text-[3.8rem] font-black tracking-tight max-w-2xl leading-[1.1]">
              A generational opportunity.
            </h2>
          </Reveal>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: "Global Creator Economy", value: 200, suffix: "B+", prefix: "$", color: "border-orange-500/20 bg-orange-500/[0.03]" },
              { label: "India UGC/Influencer", value: 2, suffix: "B", prefix: "$", color: "border-amber-500/20 bg-amber-500/[0.03]" },
              { label: "CAGR Growth", value: 22, suffix: "%+", prefix: "", color: "border-emerald-500/20 bg-emerald-500/[0.03]" },
              { label: "Projected 2033", value: 1, suffix: "T", prefix: "$", color: "border-blue-500/20 bg-blue-500/[0.03]" },
            ].map((item, i) => (
              <Reveal key={i} delay={0.08 * i} direction="up">
                <div className={`rounded-2xl border ${item.color} p-5 md:p-6 text-center`}>
                  <div className="text-3xl md:text-4xl font-black text-white mb-2">
                    <Counter end={item.value} prefix={item.prefix} suffix={item.suffix} />
                  </div>
                  <div className="text-[11px] text-stone-500 leading-snug font-geist-custom">{item.label}</div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3}>
            <div className="mt-12 rounded-2xl bg-stone-900/50 border border-stone-800 p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                { label: "TAM", desc: "Global Creator Economy & Digital Ads", val: "$500B+" },
                { label: "SAM", desc: "India + South Asia UGC/Influencer Mkt", val: "$4B" },
                { label: "SOM", desc: "Year 3 target (5% of SAM)", val: "$200M" },
              ].map((item, i) => (
                <div key={i} className={`${i > 0 ? "md:border-l md:border-stone-800 md:pl-8 border-t md:border-t-0 border-stone-800 pt-6 md:pt-0" : ""}`}>
                  <div className="text-xs font-bold text-stone-600 mb-1 font-geist-custom">{item.label}</div>
                  <div className="text-2xl font-black text-white mb-1">{item.val}</div>
                  <div className="text-sm text-stone-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         6. SOLUTION
         ═══════════════════════════════════════════════════════ */}
      <GradientDivider />
      <section ref={setSectionRef(5)} id="solution" className="py-24 md:py-36 px-6 bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto">
          <Reveal><Tag label="04 — The Solution" /></Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 text-4xl md:text-[3.8rem] font-black tracking-tight max-w-3xl leading-[1.1]">
              Not a talent agency.<br /><span className="text-orange-400">Not a freelance marketplace.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 text-xl text-stone-400 max-w-2xl leading-relaxed">
              Merex is infrastructure. Program the system, fund the escrow—1,000 creators go to work for your brand. Simultaneously.
            </p>
          </Reveal>

          <div className="mt-20 grid md:grid-cols-3 gap-6">
            {[
              { icon: Layers, title: "Program the Campaign", desc: "Define brief, platform, deliverables, and creator params. Brands control every variable from day zero.", tag: "Brands" },
              { icon: Users, title: "Creators Self-Select", desc: "Pre-vetted micro-creators browse and apply to campaigns matching their niche and audience. No cold pitching.", tag: "Creators" },
              { icon: Zap, title: "Execute at Scale", desc: "Hundreds of authentic content pieces produced in parallel, verified, and paid automatically. The platform handles ops.", tag: "Platform" },
            ].map((item, i) => (
              <Reveal key={i} delay={0.1 * i} direction="up">
                <div className="relative rounded-2xl bg-stone-900/50 border border-stone-800 p-7 group hover:border-orange-500/20 transition-all duration-300">
                  <div className="absolute top-5 right-5 text-[10px] font-bold text-stone-600 border border-stone-800 px-2 py-0.5 rounded-full font-geist-custom">{item.tag}</div>
                  <item.icon size={26} className="text-orange-400 mb-5" />
                  <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-stone-500 leading-relaxed text-[15px]">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         7. PRODUCT FEATURES
         ═══════════════════════════════════════════════════════ */}
      <GradientDivider />
      <section ref={setSectionRef(6)} id="product" className="py-24 md:py-36 px-6 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <Reveal><Tag label="05 — Product" color="blue" /></Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 text-4xl md:text-[3.8rem] font-black tracking-tight max-w-3xl leading-[1.1]">
              Kill micro-management.
            </h2>
          </Reveal>

          {/* F1: Campaign Builder */}
          <div className="mt-24 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div>
              <Reveal direction="left">
                <div className="text-[10px] font-bold text-stone-600 mb-4 font-geist-custom">FEATURE 01</div>
                <h3 className="text-3xl font-black text-white mb-5 leading-tight">Precision Campaign Builder</h3>
                <p className="text-stone-400 leading-relaxed mb-6">
                  Brands define exactly who works for them. Filter by followers, gender, niche, language, and location. Briefs are versioned and locked before any creator lifts a camera.
                </p>
                <div className="space-y-3">
                  {["Filter by followers (1K–5M+)", "Gender + Niche targeting", "Platform-specific deliverables", "Locked & versioned campaign brief"].map((f, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-stone-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />{f}
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
            <div className="space-y-4">
              <CampaignCard type="UGC Barter" niche="Skincare & Beauty" budget="₹8,000/mo" creators="25 creators" delay={0} />
              <CampaignCard type="One-Time Pay" niche="Fitness & Wellness" budget="₹3,500/reel" creators="10 creators" delay={0.1} />
              <CampaignCard type="Per-View Clip" niche="Fashion & Lifestyle" budget="₹0.10/view" creators="Open to all" delay={0.2} />
            </div>
          </div>

          {/* F2: Campaign Types */}
          <div className="mt-28 rounded-3xl bg-stone-900/40 border border-stone-800 p-8 md:p-12">
            <Reveal>
              <div className="text-[10px] font-bold text-stone-600 mb-4 font-geist-custom">FEATURE 02</div>
              <h3 className="text-3xl font-black text-white mb-3">Every campaign type. One platform.</h3>
              <p className="text-stone-500 max-w-2xl mb-10">Merex structures payouts around how value is actually created.</p>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { icon: Star, label: "UGC Barter", desc: "Product exchange for authentic content. Zero cash, max authenticity.", color: "text-amber-400", bg: "bg-amber-500/[0.04] border-amber-500/15" },
                { icon: DollarSign, label: "One-Time Pay", desc: "Fixed payout on approved deliverable. Clean and clear.", color: "text-blue-400", bg: "bg-blue-500/[0.04] border-blue-500/15" },
                { icon: Eye, label: "Per-View UGC", desc: "Earn per 1K views. Brands only pay for verified organic reach.", color: "text-emerald-400", bg: "bg-emerald-500/[0.04] border-emerald-500/15" },
                { icon: Play, label: "Per-View Clipping", desc: "Clippers distribute brand content. Paid purely for organic traction.", color: "text-orange-400", bg: "bg-orange-500/[0.04] border-orange-500/15" },
              ].map((item, i) => (
                <Reveal key={i} delay={0.08 * i} direction="up">
                  <div className={`rounded-2xl border ${item.bg} p-6 h-full`}>
                    <item.icon size={22} className={`${item.color} mb-4`} />
                    <h4 className="font-bold text-white mb-2 text-sm">{item.label}</h4>
                    <p className="text-[13px] text-stone-500 leading-relaxed">{item.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* F3: Review System */}
          <div className="mt-28 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <Reveal direction="left">
              <div className="text-[10px] font-bold text-stone-600 mb-4 font-geist-custom">FEATURE 03</div>
              <h3 className="text-3xl font-black text-white mb-5 leading-tight">
                Timestamped review.<br />Watermark-protected.
              </h3>
              <p className="text-stone-400 leading-relaxed mb-6">
                Brands get a Frame.io-style review UI. Pin comments to exact moments. Preview is auto-watermarked to prevent unauthorized use before approval.
              </p>
              <div className="space-y-3">
                {["Pinned timestamp comments", "Watermark protection against misuse", "Version history & revision logs", "Async creator-brand communication"].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-stone-300">
                    <MessageSquare size={13} className="text-blue-400 flex-shrink-0" />{f}
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.2} direction="right">
              <ReviewMockup />
            </Reveal>
          </div>

          {/* F4-5: Payout Flow */}
          <div className="mt-28 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <Reveal direction="left">
                <div className="text-[10px] font-bold text-stone-600 mb-4 font-geist-custom">FEATURES 04–05</div>
                <h3 className="text-3xl font-black text-white mb-5 leading-tight">
                  Approved → Live → Paid.<br /><span className="text-orange-400">Minutes, not months.</span>
                </h3>
                <p className="text-stone-400 leading-relaxed mb-8">
                  Brand approves draft. Creator posts live. Submits the link. One green flag → instant escrow payout. No emails. No invoices. No waiting.
                </p>
              </Reveal>
              {[
                { step: "STEP 01", icon: CheckCircle2, title: "Brand Approves Draft", desc: "Reviews watermarked preview. Marks approved.", active: false },
                { step: "STEP 02", icon: Upload, title: "Creator Goes Live", desc: "Posts final content on Instagram, TikTok, or YouTube.", active: false },
                { step: "STEP 03", icon: Target, title: "Link Submitted", desc: "Creator submits the public URL. Merex auto-validates.", active: false },
                { step: "STEP 04", icon: Banknote, title: "Instant Payout", desc: "Green flag → funds release to creator wallet instantly.", active: true },
              ].map((s, i) => <PayoutStep key={i} {...s} delay={0.1 * i} />)}
            </div>

            <Reveal delay={0.3} direction="right">
              <div className="sticky top-24 rounded-2xl bg-stone-900/60 border border-stone-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between">
                  <span className="text-sm font-bold text-stone-300">Escrow Wallet</span>
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 font-geist-custom">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />SECURED
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-stone-950 rounded-xl p-5 border border-stone-800">
                    <div className="text-[10px] text-stone-600 mb-1 font-geist-custom">CAMPAIGN ESCROW</div>
                    <div className="text-3xl font-black text-white">₹45,000</div>
                    <div className="text-xs text-stone-500 mt-1">Locked for 15 creators</div>
                  </div>
                  {[
                    { creator: "@glow_by_jen", amount: "₹3,500", status: "Pending Approval", color: "text-amber-400" },
                    { creator: "@fit_alex_99", amount: "₹2,800", status: "Link Submitted", color: "text-blue-400" },
                    { creator: "@reel_priya", amount: "₹3,500", status: "Paid ✓", color: "text-emerald-400" },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-stone-800 last:border-0">
                      <div>
                        <div className="text-sm font-medium text-stone-300">{row.creator}</div>
                        <div className={`text-xs font-semibold ${row.color} font-geist-custom`}>{row.status}</div>
                      </div>
                      <div className="text-sm font-bold text-white">{row.amount}</div>
                    </div>
                  ))}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-emerald-500 text-black font-bold rounded-xl text-sm hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />Approve & Release All
                  </motion.button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         8. COMPETITIVE MOAT
         ═══════════════════════════════════════════════════════ */}
      <GradientDivider />
      <section ref={setSectionRef(7)} id="moat" className="py-24 md:py-36 px-6 bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto">
          <Reveal><Tag label="06 — Competitive Moat" /></Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 text-4xl md:text-[3.8rem] font-black tracking-tight max-w-3xl leading-[1.1]">
              Not competing with Aspire.<br /><span className="text-orange-400">Replacing a behavior.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-6 text-xl text-stone-400 max-w-2xl">
              Others help brands find one creator. We let brands program a creator army—fundamentally different in design, scale, and outcome.
            </p>
          </Reveal>

          <div className="mt-16 overflow-x-auto">
            <Reveal delay={0.2}>
              {/* gradient fade hint on edges */}
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0D0D0D] to-transparent z-10 pointer-events-none md:hidden" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0D0D0D] to-transparent z-10 pointer-events-none md:hidden" />
                <table className="w-full min-w-[600px] border-collapse">
                  <thead>
                    <tr className="border-b border-stone-800">
                      <th className="text-left py-3 px-4 text-sm text-stone-600 font-semibold">Capability</th>
                      {["#paid / Aspire", "Upwork / Fiverr", "Merex"].map((h) => (
                        <th key={h} className={`py-3 px-4 text-sm font-bold text-center ${h === "Merex" ? "text-orange-400" : "text-stone-600"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Scale 1,000s of creators in parallel", "✗", "✗", "✓"],
                      ["Watermarked draft review", "✗", "✗", "✓"],
                      ["Per-view clipping campaigns", "✗", "✗", "✓"],
                      ["Escrow-backed instant payouts", "Partial", "✗", "✓"],
                      ["Creator authenticity filtering", "Partial", "✗", "✓"],
                      ["Barter + pay + per-view in one", "✗", "✗", "✓"],
                      ["Open market (no agency)", "✗", "Partial", "✓"],
                    ].map(([cap, a, b, c], i) => (
                      <tr key={i} className="border-b border-stone-900/50 hover:bg-stone-900/30 transition-colors">
                        <td className="py-3 px-4 text-sm text-stone-400">{cap}</td>
                        <td className="py-3 px-4 text-center text-sm text-red-400/70">{a}</td>
                        <td className="py-3 px-4 text-center text-sm text-stone-600">{b}</td>
                        <td className="py-3 px-4 text-center text-sm text-emerald-400 font-bold">{c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         9. BUSINESS MODEL
         ═══════════════════════════════════════════════════════ */}
      <GradientDivider />
      <section ref={setSectionRef(8)} id="model" className="py-24 md:py-36 px-6 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <Reveal><Tag label="07 — Business Model" color="emerald" /></Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 text-4xl md:text-[3.8rem] font-black tracking-tight max-w-2xl leading-[1.1]">
              We eat when creators eat.
            </h2>
          </Reveal>

          <div className="mt-16 grid md:grid-cols-2 gap-6">
            <Reveal direction="up" delay={0.1}>
              <div className="rounded-2xl bg-stone-900/50 border border-stone-800 p-8 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center"><BarChart2 size={20} className="text-orange-400" /></div>
                  <span className="text-[10px] font-bold bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full border border-orange-500/20 font-geist-custom">CORE REVENUE</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Campaign Transaction Fee</h3>
                <div className="text-5xl font-black text-white my-4">10<span className="text-2xl text-stone-600">% of GMV</span></div>
                <p className="text-stone-500 leading-relaxed">Charged to brands on success. Creators receive 100% of their rate. Revenue scales with volume.</p>
              </div>
            </Reveal>
            <Reveal direction="up" delay={0.2}>
              <div className="rounded-2xl border border-orange-500/15 bg-gradient-to-br from-orange-500/[0.04] to-transparent p-8 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center"><Zap size={20} className="text-amber-400" /></div>
                  <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20 font-geist-custom">PHASE 2</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Merex Pro</h3>
                <div className="text-5xl font-black text-white my-4">$49<span className="text-2xl text-stone-600">/mo</span></div>
                <p className="text-stone-500 leading-relaxed">Advanced analytics, priority matching, campaign templates, and white-label API for agencies.</p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.3}>
            <div className="mt-10 rounded-2xl bg-stone-900/50 border border-stone-800 p-6 md:p-8">
              <h4 className="text-[11px] font-bold text-stone-600 uppercase tracking-[0.15em] mb-6 font-geist-custom">Revenue Projection (Conservative)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {[
                  { year: "Year 1", gmv: "₹2Cr", rev: "₹20L", note: "Beta · 20 brands · 200 creators" },
                  { year: "Year 2", gmv: "₹20Cr", rev: "₹2Cr", note: "Series A growth · 5 cities" },
                  { year: "Year 3", gmv: "₹100Cr", rev: "₹10Cr+", note: "National scale · Pro subs live" },
                ].map((item, i) => (
                  <div key={i} className={`${i > 0 ? "md:border-l md:border-stone-800 md:pl-8 border-t md:border-t-0 border-stone-800 pt-6 md:pt-0" : ""}`}>
                    <div className="text-xs text-stone-600 mb-2 font-geist-custom">{item.year}</div>
                    <div className="text-2xl font-black text-white mb-1">{item.gmv}</div>
                    <div className="text-sm font-bold text-orange-400 mb-2">{item.rev} Net</div>
                    <div className="text-xs text-stone-600">{item.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         10. GTM
         ═══════════════════════════════════════════════════════ */}
      <GradientDivider />
      <section ref={setSectionRef(9)} id="gtm" className="py-24 md:py-36 px-6 bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto">
          <Reveal><Tag label="08 — Go To Market" color="blue" /></Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 text-4xl md:text-[3.8rem] font-black tracking-tight max-w-2xl leading-[1.1]">
              India first.<br /><span className="text-blue-400">Planet later.</span>
            </h2>
          </Reveal>

          <div className="mt-16 grid md:grid-cols-3 gap-6">
            {[
              { phase: "Phase 1", title: "Private Beta — India", time: "Q3 2026", items: ["100 pre-vetted creators", "20 DTC brand pilots", "Instagram-first, manual review"], active: true },
              { phase: "Phase 2", title: "Open Market — Scale", time: "Q1 2027", items: ["AI authenticity scoring", "5 metro cities, 1,000+ creators", "Self-serve brand onboarding"], active: false },
              { phase: "Phase 3", title: "Enterprise + API", time: "Q3 2027", items: ["Agency white-label API", "YouTube + LinkedIn expansion", "South Asia rollout"], active: false },
            ].map((item, i) => (
              <Reveal key={i} delay={0.1 * i} direction="up">
                <div className={`rounded-2xl p-7 h-full border ${item.active ? "bg-stone-900/60 border-orange-500/20" : "bg-stone-900/30 border-stone-800"}`}>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-bold text-stone-600 font-geist-custom">{item.phase}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full font-geist-custom ${item.active ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : "bg-stone-800 text-stone-500"}`}>{item.time}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-4">{item.title}</h3>
                  <ul className="space-y-2.5">
                    {item.items.map((it, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-stone-400">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${item.active ? "bg-orange-400" : "bg-stone-700"}`} />{it}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         11. THE ASK
         ═══════════════════════════════════════════════════════ */}
      <GradientDivider />
      <section ref={setSectionRef(10)} id="ask" className="py-28 md:py-44 px-6 relative overflow-hidden bg-[#0A0A0A]">
        <motion.div style={{ y: useTransform(scrollY, [0, 8000], [0, -60]) }} className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-orange-500/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Reveal><Tag label="09 — The Ask" /></Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-6 text-5xl md:text-[5rem] font-black tracking-[-0.03em] leading-[1.05]">
              Join us in building<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-300">the open market.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-8 text-xl text-stone-400 max-w-2xl mx-auto leading-relaxed">
              Raising <strong className="text-white">seed capital</strong> and onboarding <strong className="text-white">strategic partners</strong> to accelerate brand adoption across India and scale our creator network.
            </p>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
            <Reveal delay={0.3} direction="left">
              <div className="rounded-2xl bg-stone-900/50 border border-stone-800 p-7">
                <TrendingUp size={22} className="text-emerald-400 mb-4" />
                <h4 className="font-bold text-white mb-2">For VCs</h4>
                <p className="text-sm text-stone-500 leading-relaxed">Seed investment to fund engineering, creator acquisition, and brand GTM in India's scaling creator economy.</p>
              </div>
            </Reveal>
            <Reveal delay={0.35} direction="right">
              <div className="rounded-2xl bg-stone-900/50 border border-stone-800 p-7">
                <Globe size={22} className="text-blue-400 mb-4" />
                <h4 className="font-bold text-white mb-2">For Strategic Partners</h4>
                <p className="text-sm text-stone-500 leading-relaxed">Brand networks, creator talent pools, and distribution partners to expand supply and demand simultaneously.</p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.45}>
            <div className="mt-14 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:nischal@ongram.in"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-full text-lg hover:scale-[1.04] transition-transform shadow-2xl shadow-white/5">
                <Mail size={20} />nischal@ongram.in
              </a>
              <a href="/early-access"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/[0.04] border border-white/10 text-white font-semibold rounded-full text-lg hover:bg-white/[0.08] transition-colors">
                Request Early Access <ArrowRight size={18} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <GradientDivider />
      <footer className="py-10 px-6 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-tilt font-black text-2xl text-white">merex</div>
          <div className="text-sm text-stone-700 font-geist-custom">Confidential · For investor use only · © 2026 Merex Technologies</div>
          <a href="mailto:nischal@ongram.in" className="text-sm text-stone-600 hover:text-orange-400 transition-colors">nischal@ongram.in</a>
        </div>
      </footer>

      {/* ═══ BACK TO TOP ═══ */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-8 left-8 z-50 w-10 h-10 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-stone-400 hover:text-white hover:border-stone-600 transition-colors shadow-lg"
          >
            <ArrowUp size={16} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
