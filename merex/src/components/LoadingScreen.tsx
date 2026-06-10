"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoadingScreen() {
  const [isMounted, setIsMounted] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    // Short, quick loading delay (800ms) to prevent blocking the user
    const minTimer = setTimeout(() => {
      setShow(false);
    }, 800);

    return () => {
      clearTimeout(minTimer);
    };
  }, []);

  if (!isMounted) {
    // Render static black overlay on server to prevent flash of content
    return (
      <div className="fixed inset-0 bg-[#0F0E0E] z-[99999]" />
    );
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.3, ease: "easeInOut" }
          }}
          className="fixed inset-0 bg-[#0F0E0E] z-[99999] flex items-center justify-center overflow-hidden select-none pointer-events-none"
        >
          {/* Subtle Breathing/Throbbing Logo */}
          <motion.div
            initial={{ opacity: 0.3, scale: 0.98 }}
            animate={{
              opacity: [0.4, 0.85, 0.4],
              scale: [0.98, 1.01, 0.98],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] relative flex items-center justify-center"
          >
            <img
              src="/landing/tv-logo-white.png"
              alt="Merex Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
