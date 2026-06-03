"use client";

import Link from "next/link";
import type { Route } from "next";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export default function LandingHeader() {
  const { scrollY } = useScroll();
  // Fade in the brand wordmark next to the logo between 100px and 220px scroll
  const brandOpacity = useTransform(scrollY, [100, 220], [0, 1]);

  // Only apply the noise background image on md+ screens (≥768px)
  // On mobile it renders as visible stripes — use solid color only
  const [isMd, setIsMd] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsMd(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMd(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const noiseStyle = isMd
    ? {
        backgroundImage: "url(/landing/button-noise.png)",
        backgroundBlendMode: "overlay" as const,
        backgroundSize: "16px 16px",
      }
    : {};

  const itemStyle = {
    display: "flex",
    flexDirection: "row" as const,
    justifyContent: "center",
    alignItems: "center",
    padding: "12px",
    height: "52px",
    fontFamily: "'Geist', sans-serif",
    fontStyle: "normal",
    fontWeight: 600,
    fontSize: "20px",
    lineHeight: "140%",
    letterSpacing: "-0.02em",
    fontFeatureSettings: "'ss01' on, 'ss03' on",
    color: "#0F0E0E",
    textDecoration: "none",
    boxSizing: "border-box" as const,
    transition: "transform 0.2s ease, opacity 0.2s ease",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "0px",
        left: "0px",
        right: "0px",
        zIndex: 50,
        display: "flex",
        justifyContent: "center",
        width: "100%",
        pointerEvents: "none",
      }}
    >
      <header
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "10px 20px 0px 20px",
          gap: "8px",
          width: "100%",
          maxWidth: "1260px",
          height: "62px",
          boxSizing: "border-box",
          pointerEvents: "auto",
        }}
      >
        {/* Logo */}
        <Link
          href={"/" as Route}
          style={{
            width: "44px",
            height: "44px",
            flex: "none",
            order: 0,
            flexGrow: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <img
            src="/landing/tv-logo-white.png"
            alt="Logo"
            style={{
              width: "44px",
              height: "44px",
              objectFit: "contain",
            }}
          />
          {/* Brand Wordmark — hidden on mobile to prevent overlap */}
          <motion.span
            id="header-brand-wordmark"
            className="hidden md:block"
            style={{
              fontFamily: "'Tilt Warp', sans-serif",
              fontSize: "24px",
              color: "#F6F8FB",
              textTransform: "lowercase",
              letterSpacing: "-0.04em",
              position: "absolute",
              left: "54px",
              whiteSpace: "nowrap",
              opacity: brandOpacity,
              userSelect: "none",
            }}
          >
            merex
          </motion.span>
        </Link>

        {/* Links */}
        <nav className="flex flex-row items-center gap-1.5 md:gap-2 flex-none order-1">
          {/* Home */}
          <Link
            href={"/" as Route}
            className="hover:scale-105 active:scale-[0.98] flex items-center justify-center font-semibold text-[#0F0E0E] no-underline transition-transform
              text-[13px] px-2.5 h-8 rounded-none
              md:text-[20px] md:px-3 md:h-[52px]"
            style={{
              ...noiseStyle,
              backgroundColor: "#FF5700",
              letterSpacing: "-0.02em",
              fontFamily: "'Geist', sans-serif",
              boxSizing: "border-box",
            }}
          >
            Home
          </Link>
          {/* Creator */}
          <Link
            href={"/login/creator" as Route}
            className="hover:scale-105 active:scale-[0.98] flex items-center justify-center font-semibold text-[#0F0E0E] no-underline transition-transform
              text-[13px] px-2.5 h-8 rounded-full
              md:text-[20px] md:px-3 md:h-[52px]"
            style={{
              ...noiseStyle,
              backgroundColor: "#32CE57",
              letterSpacing: "-0.02em",
              fontFamily: "'Geist', sans-serif",
              boxSizing: "border-box",
            }}
          >
            Creator
          </Link>
          {/* Business */}
          <Link
            href={"/login/business" as Route}
            className="hover:scale-105 active:scale-[0.98] flex items-center justify-center font-semibold text-[#0F0E0E] no-underline transition-transform
              text-[13px] px-2.5 h-8 rounded-md
              md:text-[20px] md:px-3 md:h-[52px]"
            style={{
              ...noiseStyle,
              backgroundColor: "#A3CAFF",
              letterSpacing: "-0.02em",
              fontFamily: "'Geist', sans-serif",
              boxSizing: "border-box",
            }}
          >
            Business
          </Link>
        </nav>

        {/* Spacer */}
        <div
          style={{
            width: "44px",
            height: "44px",
            flex: "none",
            order: 2,
            flexGrow: 0,
          }}
        />
      </header>
    </div>
  );
}
