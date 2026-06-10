"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useMotionValue, useAnimationFrame, type MotionValue } from "framer-motion";
import LandingHeader from "@/components/LandingHeader";

// Custom premium SVG Icons
const GlobeIcon = () => (
  <svg className="w-6 h-6 text-current" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20" />
  </svg>
);

const CopyrightIcon = () => (
  <svg className="w-6 h-6 text-current" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M14.83 14.83a4 4 0 1 1 0-5.66" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-6 h-6 text-current" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// High-Fidelity Styled Media Objects using downloaded Figma PNG assets
const Polaroid = () => (
  <div className="w-[224px] h-[270px] select-none shrink-0 rotate-[-1.5deg] hover:rotate-0 hover:scale-105 duration-350 transition-all">
    <img src="/landing/polaroid.png" alt="Polaroid" className="w-full h-full object-contain filter drop-shadow-xl" />
  </div>
);

const PaperScrap = () => (
  <div className="w-[192px] h-[350px] select-none shrink-0 rotate-[2.5deg] hover:rotate-0 hover:scale-105 duration-350 transition-all">
    <img src="/landing/paper_scrap.png" alt="Paper Scrap" className="w-full h-full object-contain filter drop-shadow-lg" />
  </div>
);

const VinylRecord = () => (
  <div className="w-[320px] h-[320px] select-none shrink-0 transition-all hover:scale-105 duration-500 animate-[spin_12s_linear_infinite_paused] hover:animate-[spin_12s_linear_infinite]">
    <img src="/landing/vinyl_record.png" alt="Vinyl Record" className="w-full h-full object-contain filter drop-shadow-2xl" />
  </div>
);

const VhsTape = () => (
  <div className="w-[313px] h-[180px] select-none shrink-0 rotate-[-2deg] hover:rotate-0 hover:scale-105 duration-350 transition-all">
    <img src="/landing/vhs_tape.png" alt="VHS Tape" className="w-full h-full object-contain filter drop-shadow-lg" />
  </div>
);

const Cassette = () => (
  <div className="w-[255px] h-[160px] select-none shrink-0 rotate-[1.5deg] hover:rotate-0 hover:scale-105 duration-350 transition-all">
    <img src="/landing/cassette.png" alt="Cassette Tape" className="w-full h-full object-contain filter drop-shadow-lg" />
  </div>
);

const FloppyDisk = () => (
  <div className="w-[235px] h-[241px] select-none shrink-0 rotate-[-2.5deg] hover:rotate-0 hover:scale-105 duration-350 transition-all">
    <img src="/landing/floppy_disk.png" alt="Floppy Disk" className="w-full h-full object-contain filter drop-shadow-xl" />
  </div>
);

const Telegram = () => (
  <div className="w-[348px] h-[240px] select-none shrink-0 rotate-[-1deg] hover:rotate-0 hover:scale-105 duration-350 transition-all">
    <img src="/landing/telegram.png" alt="Telegram Message" className="w-full h-full object-contain filter drop-shadow-xl" />
  </div>
);

const Postcard = () => (
  <div className="w-[443px] h-[309px] select-none shrink-0 rotate-[1.5deg] hover:rotate-0 hover:scale-105 duration-350 transition-all">
    <img src="/landing/postcard.png" alt="Postcard" className="w-full h-full object-contain filter drop-shadow-2xl" />
  </div>
);

interface WordInfo {
  text: string;
  isBold: boolean;
}

const ugcSegments = [
  { text: "Most brands struggle to consistently create high-performing ", bold: false },
  { text: "Instagram Reels", bold: true },
  { text: ". Our bounty system lets you crowdsource authentic Reels from hundreds of ", bold: false },
  { text: "everyday creators", bold: true },
  { text: ", paying only for content that matches your brief. ", bold: false },
  { text: "Flood the algorithm", bold: true },
  { text: " with organic, relatable content overnight.", bold: false }
];

const clippingSegments = [
  { text: "Turn hours of podcasts, webinars, and product demos into virality. Our ", bold: false },
  { text: "clipping engine", bold: true },
  { text: " helps creators segment long-form videos into high-performing ", bold: false },
  { text: "short clips", bold: true },
  { text: " designed to grab attention and drive reach, maximizing the value of your ", bold: false },
  { text: "existing content library", bold: true },
  { text: ".", bold: false }
];

const whyNowSegments = [
  { text: "Eliminate manual screenshot verification. Our platform syncs directly with the ", bold: false },
  { text: "Instagram Graph API", bold: true },
  { text: " to automatically track live post status, views, and engagement milestones. Payouts are triggered securely based on ", bold: false },
  { text: "verifiable, real-time performance data", bold: true },
  { text: ".", bold: false }
];

const finalThoughtsSegments = [
  { text: "Keep campaigns secure. Brands fund an ", bold: false },
  { text: "escrow wallet", bold: true },
  { text: " on-platform to launch campaigns. Once deliverables are verified, our system instantly releases payouts to creators. ", bold: false },
  { text: "Scale trust", bold: true },
  { text: ", minimize accounting overhead, and run barter or paid campaigns seamlessly.", bold: false }
];

function compileSegments(segments: { text: string; bold: boolean }[]): WordInfo[] {
  const result: WordInfo[] = [];
  segments.forEach((seg) => {
    const words = seg.text.split(" ");
    words.forEach((w) => {
      if (w !== "") {
        result.push({ text: w, isBold: seg.bold });
      }
    });
  });
  return result;
}

function ScrollWord({ word, progress, index, total }: { word: WordInfo; progress: MotionValue<number>; index: number; total: number }) {
  // Each word is written from left to right as the scroll progress moves from start to end
  const start = index / total;
  const end = (index + 0.85) / total; // slightly faster than the full slot to give a gap

  // clipPath percent goes from 100 (hidden) to 0 (fully revealed)
  const clipPercent = useTransform(progress, [start, end], [100, 0]);
  const clipPath = useTransform(clipPercent, (v) => `inset(0 ${v}% 0 0)`);
  
  // Track if the word has been fully written, initializing based on current scroll position
  const [isWritten, setIsWritten] = useState(() => progress.get() >= end);

  useEffect(() => {
    const unsubscribe = progress.on("change", (latest) => {
      if (latest >= end) {
        setTimeout(() => setIsWritten(true), 0);
      } else if (latest < start) {
        setTimeout(() => setIsWritten(false), 0);
      }
    });

    return () => unsubscribe();
  }, [progress, start, end]);

  return (
    <motion.span
      style={{
        clipPath,
        WebkitClipPath: clipPath,
        display: "inline-block",
      }}
      animate={{
        fontWeight: word.isBold && isWritten ? 700 : 400,
        scale: word.isBold && isWritten ? [1, 1.08, 1] : 1,
        color: "rgb(15, 14, 14)",
      }}
      transition={{
        fontWeight: { duration: 0.25, ease: "easeOut" },
        scale: { duration: 0.25, times: [0, 0.4, 1], ease: "easeOut" },
      }}
      className="mr-1.5"
    >
      {word.text}
    </motion.span>
  );
}

interface ScrollHighlightParagraphProps {
  segments: { text: string; bold: boolean }[];
  progress: MotionValue<number>;
}

function ScrollHighlightParagraph({ segments, progress }: ScrollHighlightParagraphProps) {
  // Initialize hasCompleted based on current progress
  const [hasCompleted, setHasCompleted] = useState(() => progress.get() >= 0.98);

  useEffect(() => {
    if (hasCompleted) return;
    const unsubscribe = progress.on("change", (latest) => {
      if (latest >= 0.98) {
        setTimeout(() => setHasCompleted(true), 0);
      }
    });
    return () => unsubscribe();
  }, [progress, hasCompleted]);

  const words = compileSegments(segments);
  const totalWords = words.length;

  return (
    <p
      className="font-geist-custom text-[20px] text-[#0f0e0e]/25 leading-relaxed font-normal flex flex-wrap"
    >
      {words.map((word, idx) => {
        if (hasCompleted) {
          return (
            <span
              key={idx}
              className={`inline-block mr-1.5 text-[#0F0E0E] ${word.isBold ? "font-bold" : ""}`}
            >
              {word.text}
            </span>
          );
        }

        return (
          <ScrollWord
            key={idx}
            word={word}
            progress={progress}
            index={idx}
            total={totalWords}
          />
        );
      })}
    </p>
  );
}

interface RetroControlBoardProps {
  activeIndex: number;
  scrollToCard: (idx: number) => void;
}

function RetroControlBoard({ activeIndex, scrollToCard }: RetroControlBoardProps) {
  const logs = [
    [
      "merex:~# run ugc_bounty.sh",
      "[OK] mapping 2.4k verified creators",
      "[OK] bounty campaign active",
      "[SYSTEM] ready for content intake"
    ],
    [
      "merex:~# start clipping_engine",
      "[OK] ingest podcast_source_file.mp4",
      "[OK] generating AI shorts & segments",
      "[SYSTEM] 12 reels compiled & queued"
    ],
    [
      "merex:~# check api_validator.py",
      "[OK] instagram graph connection established",
      "[OK] live post metrics sync: online",
      "[SYSTEM] deliverable verification active"
    ],
    [
      "merex:~# run payout_ledger.rs",
      "[OK] escrow wallet funded: verified",
      "[OK] automated payouts enabled",
      "[SYSTEM] ready for creator settlements"
    ]
  ];

  return (
    <div className="w-full bg-stone-900 border-2 border-stone-800 rounded-xl p-6 font-mono text-[11px] text-stone-300 shadow-[6px_6px_0px_rgba(15,14,14,1)] select-none">
      <div className="flex items-center justify-between border-b border-stone-800/80 pb-3 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80 border border-red-500/40"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80 border border-yellow-500/40"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/80 border border-green-500/40"></div>
        </div>
        <span className="text-[10px] text-stone-500 lowercase font-bold tracking-wide">
          [ system_control_board.cfg ]
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 border-b border-stone-800/60 pb-3.5 mb-4 text-stone-400">
        <div>
          <span className="text-stone-600">STATUS:</span> <span className="text-emerald-400 font-bold">ONLINE</span>
        </div>
        <div>
          <span className="text-stone-600">ACTIVE:</span> <span className="text-stone-200">NODE_0{activeIndex + 1}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-6">
        <span className="text-stone-600 font-bold uppercase tracking-wider text-[9px] mb-1">Select Module:</span>
        {[
          { label: "UGC Bounties", index: 0 },
          { label: "Clipping Engine", index: 1 },
          { label: "API Verification", index: 2 },
          { label: "Wallet Settlements", index: 3 }
        ].map((item) => {
          const isActive = activeIndex === item.index;
          return (
            <button
              key={item.index}
              onClick={() => scrollToCard(item.index)}
              className={`flex items-center justify-between text-left px-3 py-2 border rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-stone-800 border-stone-700 text-stone-100 font-bold translate-x-1"
                  : "bg-transparent border-transparent text-stone-500 hover:text-stone-300"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? "text-emerald-400 font-bold" : "text-stone-600"}>
                  0{item.index + 1}.
                </span>
                <span>{item.label}</span>
              </div>
              
              {isActive && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] text-emerald-400 uppercase tracking-widest opacity-80">ACTIVE</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-stone-950 border border-stone-800 rounded-lg p-4 font-mono text-[10px] leading-relaxed text-stone-400 flex flex-col gap-1 h-[115px] justify-start overflow-hidden">
        {logs[activeIndex].map((line, idx) => (
          <div
            key={idx}
            className={
              line.startsWith("merex")
                ? "text-stone-300"
                : line.includes("[OK]")
                ? "text-emerald-400/90"
                : line.includes("[WARNING]")
                ? "text-yellow-400/90"
                : "text-stone-500"
            }
          >
            {line}
          </div>
        ))}
        <div className="flex items-center gap-1 text-stone-300 mt-1">
          <span>merex:~#</span>
          <span className="w-1.5 h-3 bg-stone-300 animate-pulse"></span>
        </div>
      </div>
    </div>
  );
}

interface ScrollStackSectionProps {
  index: number;
  title: string;
  fileName: string;
  size: string;
  segments: { text: string; bold: boolean }[];
  progress: MotionValue<number>;
}

function ScrollStackSection({ index, title, fileName, size, segments, progress }: ScrollStackSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const typingProgress = useTransform(progress, [0.1, 0.9], [0, 1]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-auto flex flex-col justify-start items-center"
      style={{
        zIndex: index + 10,
      }}
    >
      <div
        className="w-full bg-stone-100 border-2 border-stone-800 rounded-xl shadow-[6px_6px_0px_rgba(15,14,14,1)] overflow-hidden transition-all duration-300"
      >
        <div className="flex items-center justify-between bg-stone-800 px-4 py-2.5 text-white border-b-2 border-stone-800 select-none">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 border border-red-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-yellow-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 border border-green-500"></div>
          </div>
          <span className="text-[10px] font-mono font-bold lowercase tracking-wider text-stone-300">
            {fileName}
          </span>
          <div className="w-12"></div>
        </div>

        <div className="p-8 flex flex-col gap-6">
          <h2 className="font-tilt text-[22px] md:text-[28px] lg:text-[32px] text-[#0F0E0E] tracking-wide">
            {title}
          </h2>
          <ScrollHighlightParagraph segments={segments} progress={typingProgress} />
        </div>

        <div className="flex items-center justify-between bg-stone-200/60 px-4 py-1.5 border-t-2 border-stone-800 text-[9px] font-mono text-stone-600 select-none">
          <span>ENCODING: UTF-8</span>
          <span>SIZE: {size}</span>
        </div>
      </div>
    </div>
  );
}

function StaticCardSection({ title, fileName, size, segments }: { title: string; fileName: string; size: string; segments: { text: string; bold: boolean }[] }) {
  return (
    <div className="w-full bg-stone-100 border-2 border-stone-800 rounded-xl shadow-[5px_5px_0px_rgba(15,14,14,1)] overflow-hidden">
      <div className="flex items-center justify-between bg-stone-800 px-4 py-2 text-white border-b-2 border-stone-800 select-none">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-400"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
        </div>
        <span className="text-[9px] font-mono font-bold lowercase tracking-wider text-stone-300">
          {fileName}
        </span>
        <div className="w-8"></div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <h2 className="font-tilt text-[18px] text-[#0F0E0E] tracking-wide">{title}</h2>
        <p className="text-[14px] text-[#0F0E0E]/85 leading-relaxed">
          {segments.map((seg, i) =>
            seg.bold
              ? <strong key={i} className="text-[#0F0E0E] font-bold">{seg.text} </strong>
              : <span key={i}>{seg.text}</span>
          )}
        </p>
      </div>

      <div className="flex items-center justify-between bg-stone-200/60 px-4 py-1 border-t-2 border-stone-800 text-[8px] font-mono text-stone-500">
        <span>ENCODING: UTF-8</span>
        <span>SIZE: {size}</span>
      </div>
    </div>
  );
}

export default function LandingPageClient() {
  const { scrollY } = useScroll();
  const marqueeRef = useRef<HTMLDivElement>(null);

  // Retro control board index tracking & refs:
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const desktopSectionRef = useRef<HTMLDivElement>(null);

  // Use scroll progress of the desktop section container
  const { scrollYProgress } = useScroll({
    target: desktopSectionRef,
    offset: ["start start", "end end"]
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      // Map parent scroll progress [0, 1] to card index [0, 3]
      const idx = Math.min(3, Math.floor(latest * 4));
      setActiveCardIndex(idx);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Create local progress MotionValues for each card
  const card0Progress = useTransform(scrollYProgress, [0.0, 0.25], [0, 1]);
  const card1Progress = useTransform(scrollYProgress, [0.25, 0.5], [0, 1]);
  const card2Progress = useTransform(scrollYProgress, [0.5, 0.75], [0, 1]);
  const card3Progress = useTransform(scrollYProgress, [0.75, 1.0], [0, 1]);

  const scrollToCard = (idx: number) => {
    const el = desktopSectionRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const sectionHeight = rect.height;
      const sectionTop = rect.top + window.scrollY;
      
      // Calculate progress center for this card
      // Card 0: 0.125, Card 1: 0.375, Card 2: 0.625, Card 3: 0.875
      const progress = (idx + 0.5) / 4;
      const targetScrollY = sectionTop + progress * (sectionHeight - window.innerHeight);
      
      window.scrollTo({
        top: targetScrollY,
        behavior: "smooth"
      });
    }
  };

  // Automatic carousel (slow) with scroll‑controlled acceleration
  const baseSpeed = -30; // px per second, leftward slow scroll
  // Boost up to +200 px/s when the page is scrolled down
  const scrollBoost = useTransform(scrollY, [0, 500], [0, 200]);
  const marqueeX = useMotionValue(0);

  // Update position on each animation frame
  useAnimationFrame((_time, delta) => {
    const boost = scrollBoost.get(); // current boost value (px/s)
    const increment = (baseSpeed + boost) * (delta / 1000);
    const next = marqueeX.get() + increment;
    // Reset when the text has fully moved leftward (approx width 1400px)
    marqueeX.set(next <= -1400 ? 0 : next);
  });

  // Dynamic offset positioning mapping for the flight-transition to the header brand wordmark
  const [offsets, setOffsets] = useState({ x: 10, y: -102, scale: 0.16 });

  useEffect(() => {
    const calculateOffsets = () => {
      const headerWordmark = document.getElementById("header-brand-wordmark");
      const heroTitle = document.getElementById("hero-brand-title");

      if (headerWordmark && heroTitle) {
        const logoRect = headerWordmark.getBoundingClientRect();
        const heroRect = heroTitle.getBoundingClientRect();
        const currentScroll = window.scrollY;

        // Get computed font size of hero title to calculate precise target scale
        const heroStyle = window.getComputedStyle(heroTitle);
        const heroFontSize = parseFloat(heroStyle.fontSize) || 152;
        const targetScale = 24 / heroFontSize;

        const xShift = logoRect.left - heroRect.left;
        
        // Calculate vertical translation to match top edges at scrollY = 220px
        const yShiftAtZero = logoRect.top - (heroRect.top + currentScroll);
        const yShift = yShiftAtZero + 220;

        setOffsets({ x: xShift, y: yShift, scale: targetScale });
      }
    };

    calculateOffsets();
    const timer = setTimeout(calculateOffsets, 150);

    window.addEventListener("resize", calculateOffsets);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateOffsets);
    };
  }, []);

  // Hero Title Animation (flies up, shrinks, and lands exactly on the header logo wordmark):
  const heroTitleScale = useTransform(scrollY, [0, 220], [1, offsets.scale]);
  const heroTitleX = useTransform(scrollY, [0, 220], [0, offsets.x]);
  const heroTitleY = useTransform(scrollY, [0, 220], [0, offsets.y]);
  const heroTitleOpacity = useTransform(scrollY, [100, 220], [1, 0]);



  return (
    <div className="bg-noise-grid min-h-screen text-[#F6F8FB] font-geist-custom select-text">
      <LandingHeader />
      
      {/* 1. HERO SECTION (w:1260, h:800 in Figma, cornerRadius: 8) */}
      <section className="max-w-[1260px] mx-auto my-6 relative overflow-hidden rounded-lg border border-border/10 h-[800px] flex flex-col justify-center px-8 md:px-16 py-20 bg-stone-950/80 shadow-2xl">
        {/* Background Video Player */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 opacity-25"
        >
          <source src="/landing/trippy-bg.mp4" type="video/mp4" />
        </video>
        
        {/* Dark Overlay & Retro Grain Texture to prevent text competition */}
        <div className="absolute inset-0 bg-[#0F0E0E]/70 z-0 pointer-events-none"></div>
        <div className="absolute inset-0 bg-noise-grid opacity-40 mix-blend-overlay z-0 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E0E]/90 via-transparent to-[#0F0E0E]/40 z-0 pointer-events-none"></div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl">
          <motion.h1
            id="hero-brand-title"
            style={{
              scale: heroTitleScale,
              x: heroTitleX,
              y: heroTitleY,
              opacity: heroTitleOpacity,
              transformOrigin: "left top",
            }}
            className="text-[clamp(4rem,10vw,9.5rem)] font-tilt text-[#F6F8FB] lowercase leading-[0.8] select-none tracking-tighter"
          >
            merex
          </motion.h1>
          <div className="mt-10 max-w-[1215px] flex flex-col items-start gap-8">
            <p className="font-serif-custom text-2xl sm:text-3xl md:text-[40px] leading-tight text-[#F6F8FB] tracking-tight">
              Advertising doesn't always convince you that a product is good; it just introduces you so many times that you accept it as a roommate.
            </p>
            <Link
              href="/early-access"
              className="px-6 py-3.5 bg-[#F6F8FB] text-[#0F0E0E] rounded-lg font-mono font-bold text-xs tracking-wider uppercase border border-transparent hover:bg-transparent hover:text-[#F6F8FB] hover:border-[#F6F8FB] transition-all duration-300 shadow-[4px_4px_0px_rgba(255,255,255,0.2)] hover:shadow-none select-none"
            >
              Get Early Access
            </Link>
          </div>
        </div>
      </section>

      {/* 2. INTRO SECTION (w:1260, h:324, padding=t:120,r:40,b:120,l:40) */}
      <section className="max-w-[1260px] mx-auto px-10 py-[120px] border-b border-border/10">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-10 md:gap-12">
          <div className="font-geist-custom font-semibold text-[20px] text-[#F6F8FB] opacity-60 uppercase tracking-widest font-mono">
            Intro
          </div>
          <div className="font-geist-custom font-semibold text-[20px] sm:text-[22px] leading-relaxed text-[#F6F8FB] max-w-[940px] flex flex-col gap-6">
            <p>
              Merex is building the infrastructure layer for organic internet fame. For the first time, brands can programmatically scale visibility through high-volume UGC and clipping that feels native to the algorithm, not manufactured by ads.
            </p>
            <p className="opacity-80 font-medium">
              Proudly Built in India <img src="/android-chrome-192x192.png" alt="Indian Flag" className="inline-block w-6 h-6 align-middle ml-1 rounded-sm" />
            </p>
          </div>
        </div>
      </section>

      {/* 3a. MOBILE — static text cards (no sticky/animation) */}
      <section className="md:hidden bg-noise-light text-[#0F0E0E] py-10 px-5 border-b border-border/10">
        <div className="flex flex-col gap-6">
          <StaticCardSection title="Bounty UGC Campaigns" fileName="ugc_bounty.sh" size="4.8KB" segments={ugcSegments} />
          <StaticCardSection title="Short-Form Clipping Engine" fileName="clipping_engine.bin" size="4.2KB" segments={clippingSegments} />
          <StaticCardSection title="Meta API Automated Verification" fileName="api_validator.py" size="5.5KB" segments={whyNowSegments} />
          <StaticCardSection title="Escrow Wallets & Automated Settlements" fileName="payout_ledger.rs" size="3.2KB" segments={finalThoughtsSegments} />
          <div className="border-t border-stone-300 pt-6 flex items-center justify-between text-stone-500">
            <span className="font-mono text-xs uppercase tracking-wider">MEREX</span>
            <div className="flex items-center gap-4"><GlobeIcon /><CopyrightIcon /><TargetIcon /></div>
          </div>
        </div>
      </section>

      {/* 3b. DESKTOP — animated sticky scroll stack with retro control board */}
      <section ref={desktopSectionRef} className="hidden md:block bg-noise-light text-[#0F0E0E] relative border-b border-border/10 h-[150vh] pt-16 pb-16">
        <div 
          style={{
            top: "140px",
            height: "calc(100vh - 240px)",
            minHeight: "520px"
          }}
          className="sticky max-w-[1200px] mx-auto px-8 flex flex-col justify-between w-full"
        >
          
          {/* Main Content: Sidebar + Cards */}
          <div className="flex gap-12 items-start w-full flex-1">
            {/* Left Column: Sticky Retro Control Board */}
            <div className="w-[38%] z-20">
              <RetroControlBoard
                activeIndex={activeCardIndex}
                scrollToCard={scrollToCard}
              />
            </div>

            {/* Right Column: In-place OS Window Card View */}
            <div className="w-[62%] relative h-full">
              {/* Card 0 */}
              <div className={`absolute inset-x-0 top-0 transition-opacity duration-300 ${activeCardIndex === 0 ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"}`}>
                <ScrollStackSection
                  index={0}
                  progress={card0Progress}
                  title="Bounty UGC Campaigns"
                  fileName="ugc_bounty.sh"
                  size="4.8KB"
                  segments={ugcSegments}
                />
              </div>
              {/* Card 1 */}
              <div className={`absolute inset-x-0 top-0 transition-opacity duration-300 ${activeCardIndex === 1 ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"}`}>
                <ScrollStackSection
                  index={1}
                  progress={card1Progress}
                  title="Short-Form Clipping Engine"
                  fileName="clipping_engine.bin"
                  size="4.2KB"
                  segments={clippingSegments}
                />
              </div>
              {/* Card 2 */}
              <div className={`absolute inset-x-0 top-0 transition-opacity duration-300 ${activeCardIndex === 2 ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"}`}>
                <ScrollStackSection
                  index={2}
                  progress={card2Progress}
                  title="Meta API Automated Verification"
                  fileName="api_validator.py"
                  size="5.5KB"
                  segments={whyNowSegments}
                />
              </div>
              {/* Card 3 */}
              <div className={`absolute inset-x-0 top-0 transition-opacity duration-300 ${activeCardIndex === 3 ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"}`}>
                <ScrollStackSection
                  index={3}
                  progress={card3Progress}
                  title="Escrow Wallets & Automated Settlements"
                  fileName="payout_ledger.rs"
                  size="3.2KB"
                  segments={finalThoughtsSegments}
                />
              </div>
            </div>
          </div>

          {/* Section Footer: Nested inside sticky window to avoid blank bottoms */}
          <div className="w-full border-t border-stone-300 pt-6 flex items-center justify-between text-stone-500 mt-6 select-none pb-8">
            <span className="font-mono text-xs uppercase tracking-wider">MEREX</span>
            <div className="flex items-center gap-6"><GlobeIcon /><CopyrightIcon /><TargetIcon /></div>
          </div>

        </div>
      </section>



      {/* 6. SECOND OBJECTS MARQUEE (REVERSE MARQUEE WITH TELEGRAM & POSTCARD) */}
      <section className="py-[60px] border-b border-border/10 overflow-hidden relative bg-noise-grid">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0F0E0E] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0F0E0E] to-transparent z-10 pointer-events-none"></div>
        
        <div className="flex w-max gap-12 py-4 animate-marquee-fast [animation-direction:reverse] items-center">
          <Polaroid />
          <PaperScrap />
          <VinylRecord />
          <VhsTape />
          <Telegram />
          <Cassette />
          <Postcard />
          <FloppyDisk />
          {/* Loop duplicates */}
          <Polaroid />
          <PaperScrap />
          <VinylRecord />
          <VhsTape />
          <Telegram />
          <Cassette />
          <Postcard />
          <FloppyDisk />
        </div>
      </section>

      {/* 8a. MOBILE — subscribe card */}
      <section className="md:hidden px-5 pt-16 pb-10 bg-noise-grid">
        <div className="w-full bg-stone-100/90 border border-stone-200/20 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(15,14,14,0.06)_1px,transparent_0)] bg-[size:12px_12px] opacity-80 pointer-events-none"></div>
          {/* Top binder holes */}
          <div className="flex justify-between px-8 pt-6 z-10 relative">
            <div className="w-5 h-5 rounded-full bg-[#0F0E0E] shadow-inner"></div>
            <div className="w-5 h-5 rounded-full bg-[#0F0E0E] shadow-inner"></div>
            <div className="w-5 h-5 rounded-full bg-[#0F0E0E] shadow-inner"></div>
          </div>
          {/* Content */}
          <div className="flex flex-col items-center text-center gap-6 px-8 py-10 z-10 relative">
            <h2 className="font-serif-custom text-4xl text-[#0F0E0E] leading-tight select-none">
              Tune into the signal
            </h2>
            <p className="font-geist-custom text-base text-[#0f0e0e]/80 font-normal">
              No noise — just virality
            </p>
            <Link
              href={"/login" as Route}
              className="inline-flex items-center justify-center rounded-2xl bg-[#0F0E0E] text-[#F6F8FB] font-geist-custom text-[18px] font-semibold px-8 py-4 shadow-md active:scale-[0.98] transition-all"
            >
              Log In
            </Link>
          </div>
          {/* Bottom binder holes */}
          <div className="flex justify-between px-8 pb-6 z-10 relative">
            <div className="w-5 h-5 rounded-full bg-[#0F0E0E] shadow-inner"></div>
            <div className="w-5 h-5 rounded-full bg-[#0F0E0E] shadow-inner"></div>
            <div className="w-5 h-5 rounded-full bg-[#0F0E0E] shadow-inner"></div>
          </div>
        </div>
      </section>

      {/* 8b. DESKTOP — subscribe section (fixed width card with side binder holes) */}
      <section className="hidden md:flex max-w-[1280px] mx-auto px-10 pt-[180px] pb-[80px] justify-center bg-noise-grid">
        <div className="w-[1200px] h-[464px] border border-stone-200/20 bg-stone-100/90 rounded-3xl flex items-center justify-between gap-[40px] px-16 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(15,14,14,0.06)_1px,transparent_0)] bg-[size:12px_12px] opacity-80 pointer-events-none"></div>
          <div className="w-16 h-full flex flex-col justify-between py-12 items-center z-10">
            <div className="w-6 h-6 rounded-full bg-[#0F0E0E] shadow-inner"></div>
            <div className="w-6 h-6 rounded-full bg-[#0F0E0E] shadow-inner"></div>
            <div className="w-6 h-6 rounded-full bg-[#0F0E0E] shadow-inner"></div>
          </div>
          <div className="flex-1 flex flex-col items-center text-center gap-8 z-10">
            <div className="flex flex-col gap-4">
              <h2 className="font-serif-custom text-5xl sm:text-6xl md:text-[80px] text-[#0F0E0E] leading-none select-none">Tune into the signal</h2>
              <p className="font-geist-custom text-lg sm:text-[20px] text-[#0f0e0e] font-normal leading-relaxed">No noise — just virality</p>
            </div>
            <div className="mt-2">
              <Link href={"/login" as Route} className="inline-flex items-center justify-center rounded-2xl bg-[#0F0E0E] text-[#F6F8FB] font-geist-custom text-[20px] font-semibold px-8 py-4 shadow-md hover:bg-stone-900 transition-all active:scale-[0.98]">
                Log In
              </Link>
            </div>
          </div>
          <div className="w-16 h-full flex flex-col justify-between py-12 items-center z-10">
            <div className="w-6 h-6 rounded-full bg-[#0F0E0E] shadow-inner"></div>
            <div className="w-6 h-6 rounded-full bg-[#0F0E0E] shadow-inner"></div>
            <div className="w-6 h-6 rounded-full bg-[#0F0E0E] shadow-inner"></div>
          </div>
        </div>
      </section>

      {/* 7. GIANT SCROLLING TEXT MARQUEE */}
      <section ref={marqueeRef} className="py-10 md:py-[120px] bg-[#000000] border-y border-border/10 overflow-hidden relative select-none">
        <motion.div
          style={{ x: marqueeX }}
          className="flex w-max gap-8 md:gap-16 font-serif-custom text-[40px] md:text-[80px] text-[#F6F8FB] italic leading-none whitespace-nowrap"
        >
          <span>All Eyes on You  ·  Merex  ·  All Eyes on You  ·  Merex  ·  All Eyes on You  ·  Merex  ·  All Eyes on You  ·  Merex  ·</span>
          <span>All Eyes on You  ·  Merex  ·  All Eyes on You  ·  Merex  ·  All Eyes on You  ·  Merex  ·  All Eyes on You  ·  Merex  ·</span>
        </motion.div>
      </section>

      {/* 9. FOOTER SPECIFIC LOGO OVERWRITE (Large wordmark + spacing) */}
      <section className="max-w-[1280px] mx-auto px-6 py-20 border-t border-border/10 flex flex-col gap-10">
        <div className="select-none leading-none tracking-tighter uppercase font-tilt text-[clamp(4rem,15vw,12.5rem)] text-[#F6F8FB] opacity-100">
          merex
        </div>
      </section>

    </div>
  );
}
