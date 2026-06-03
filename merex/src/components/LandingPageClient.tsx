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
  { text: "Most businesses struggle to consistently create ", bold: false },
  { text: "Instagram Reels", bold: true },
  { text: " that feel authentic, relatable, and attention-grabbing. ", bold: false },
  { text: "Bounty-style UGC", bold: true },
  { text: " solves that by letting brands ", bold: false },
  { text: "crowdsource Reels", bold: true },
  { text: " from everyday creators instead of relying only on expensive influencers or agencies. This is the first time you can basically ", bold: false },
  { text: "flood the internet", bold: true },
  { text: " high quality UGC overnight.", bold: false }
];

const clippingSegments = [
  { text: "Businesses are sitting on hours of ", bold: false },
  { text: "valuable content", bold: true },
  { text: " every week, including podcasts, webinars, interviews, product demos, customer stories, and behind-the-scenes moments, but most of it never reaches the people who would actually buy from them. ", bold: false },
  { text: "Clipping", bold: true },
  { text: " helps businesses turn long-form content into ", bold: false },
  { text: "short, high-performing Instagram clips", bold: true },
  { text: " designed to grab attention and ", bold: false },
  { text: "drive reach", bold: true },
  { text: ".", bold: false }
];

const whyNowSegments = [
  { text: "Right now, ", bold: false },
  { text: "Instagram is rewarding short-form video", bold: true },
  { text: " more than ever, and businesses are under ", bold: false },
  { text: "constant pressure to post consistently", bold: true },
  { text: " to stay visible. At the same time, audiences trust authentic, creator-style content far more than polished ads. Brands no longer want one expensive campaign every few months. They need a ", bold: false },
  { text: "continuous stream of Reels", bold: true },
  { text: " that feel real, fast, and native to Instagram culture.", bold: false }
];

const finalThoughtsSegments = [
  { text: "The way businesses grow online is changing fast. Brands that ", bold: false },
  { text: "win attention today", bold: true },
  { text: " are not always the oldest, but the ones ", bold: false },
  { text: "creating the most consistent and relatable content", bold: true },
  { text: " on Instagram.", bold: false }
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

interface ScrollStackSectionProps {
  index: number;
  title: string;
  segments: { text: string; bold: boolean }[];
}

function ScrollStackSection({ index, title, segments }: ScrollStackSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollYProgress = useMotionValue(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateProgress = () => {
      const rect = el.getBoundingClientRect();
      const elementTop = rect.top + window.scrollY;
      const elementHeight = rect.height;
      const viewportHeight = window.innerHeight;
      
      const startScroll = elementTop - viewportHeight;
      const endScroll = elementTop + elementHeight;
      const totalRange = endScroll - startScroll;
      
      if (totalRange <= 0) return;
      
      const progress = (window.scrollY - startScroll) / totalRange;
      const clamped = Math.max(0, Math.min(1, progress));
      scrollYProgress.set(clamped);
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    updateProgress();

    // Small delay to ensure hydration and layout positions settle
    const timer = setTimeout(updateProgress, 100);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      clearTimeout(timer);
    };
  }, [scrollYProgress]);

  // Scale, opacity, and translate Y transitions for the overlapping/stacking depth effect
  // As progress goes from 0.55 (fully active/centered) to 0.9 (overlapped by next card)
  const scale = useTransform(scrollYProgress, [0.55, 0.9], [1, 0.93]);
  const opacity = useTransform(scrollYProgress, [0.55, 0.9], [1, 0.35]);
  const y = useTransform(scrollYProgress, [0.55, 0.9], [0, -40]);

  const isLast = index === 3;

  // Use the container entry phase to drive the text reveal animation (reveals earlier for the last card)
  const typingProgress = useTransform(scrollYProgress, isLast ? [0.0, 0.35] : [0.15, 0.5], [0, 1]);

  return (
    <div
      ref={containerRef}
      className={isLast ? "relative w-full h-auto flex flex-col justify-start items-center" : "relative w-full h-[150px] sm:h-[200px] md:h-[420px] lg:h-[500px] xl:h-[580px] flex flex-col justify-start items-center"}
      style={{
        zIndex: index + 10,
      }}
    >
      <motion.div
        style={isLast ? {
          position: "relative",
          transformOrigin: "top center",
        } : {
          scale,
          opacity,
          y,
          position: "sticky",
          top: `${140 + index * 20}px`,
          transformOrigin: "top center",
        }}
        className="w-full max-w-[620px] bg-white/95 border border-stone-200/60 rounded-2xl p-8 shadow-[0_12px_40px_rgba(15,14,14,0.06)]"
      >
        <div className="flex flex-col gap-6">
          <h2 className="font-tilt text-[22px] md:text-[28px] lg:text-[32px] text-[#0F0E0E] tracking-wide">
            {title}
          </h2>
          <ScrollHighlightParagraph segments={segments} progress={typingProgress} />
        </div>
      </motion.div>
    </div>
  );
}

// ─── Static (no-animation) card for mobile ───────────────────────────────────
function StaticCardSection({ title, segments }: { title: string; segments: { text: string; bold: boolean }[] }) {
  return (
    <div className="w-full bg-white/95 border border-stone-200/60 rounded-2xl p-6 shadow-md">
      <div className="flex flex-col gap-4">
        <h2 className="font-tilt text-[20px] text-[#0F0E0E] tracking-wide">{title}</h2>
        <p className="text-[15px] text-[#0F0E0E]/75 leading-relaxed">
          {segments.map((seg, i) =>
            seg.bold
              ? <strong key={i} className="text-[#0F0E0E] font-bold">{seg.text} </strong>
              : <span key={i}>{seg.text}</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default function LandingPageClient() {
  const { scrollY } = useScroll();
  const marqueeRef = useRef<HTMLDivElement>(null);

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
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 opacity-45"
        >
          <source src="/landing/hero-bg.mp4" type="video/mp4" />
        </video>
        
        {/* Subtle Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E0E]/90 via-[#0F0E0E]/20 to-[#0F0E0E]/40 z-0 pointer-events-none"></div>

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
          <div className="mt-10 max-w-[1215px]">
            <p className="font-serif-custom text-2xl sm:text-3xl md:text-[40px] leading-tight text-[#F6F8FB] tracking-tight">
              The mere exposure effect is a psychological phenomenon where repeated exposure to something increases familiarity, comfort, and liking toward it.
            </p>
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
        <div className="flex flex-col gap-5">
          <StaticCardSection title="Commission Content to UGC Creators" segments={ugcSegments} />
          <StaticCardSection title="Flood the Internet with Your Content" segments={clippingSegments} />
          <StaticCardSection title="Why Now?" segments={whyNowSegments} />
          <StaticCardSection title="Final Thoughts" segments={finalThoughtsSegments} />
          <div className="border-t border-stone-300 pt-6 flex items-center justify-between text-stone-500">
            <span className="font-mono text-xs uppercase tracking-wider">MEREX</span>
            <div className="flex items-center gap-4"><GlobeIcon /><CopyrightIcon /><TargetIcon /></div>
          </div>
        </div>
      </section>

      {/* 3b. DESKTOP — animated sticky scroll stack */}
      <section className="hidden md:block bg-noise-light text-[#0F0E0E] pt-20 pb-16 border-b border-border/10">
        <div className="max-w-[620px] mx-auto px-6 flex flex-col gap-1 sm:gap-2 md:gap-3 lg:gap-4">
          <ScrollStackSection index={0} title="Commission Content to UGC Creators" segments={ugcSegments} />
          <ScrollStackSection index={1} title="Flood the Internet with Your Content" segments={clippingSegments} />
          <ScrollStackSection index={2} title="Why Now?" segments={whyNowSegments} />
          <ScrollStackSection index={3} title="Final Thoughts" segments={finalThoughtsSegments} />
        </div>
        <div className="max-w-[620px] mx-auto px-6 mt-12">
          <div className="border-t border-stone-300 pt-8 flex items-center justify-between text-stone-500">
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
