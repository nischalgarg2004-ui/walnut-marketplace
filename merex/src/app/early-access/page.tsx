"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import LandingHeader from "@/components/LandingHeader";

export default function EarlyAccessPage() {
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [roleType, setRoleType] = useState<"CLIPPER" | "UGC" | "">("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{ id: string; name: string; instagramUsername: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name.trim()) {
      setError("Name is required.");
      setLoading(false);
      return;
    }
    if (!mobileNumber.trim()) {
      setError("Mobile number is required.");
      setLoading(false);
      return;
    }
    if (!instagramUsername.trim()) {
      setError("Instagram username is required.");
      setLoading(false);
      return;
    }
    if (!roleType) {
      setError("Please select a role (Clipper or UGC Creator).");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mobileNumber,
          instagramUsername,
          roleType
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to submit request.");
      }

      setSuccessData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-noise-grid min-h-screen text-[#F6F8FB] font-mono select-text flex flex-col justify-between">
      <LandingHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-32">
        <div className="w-full max-w-lg bg-stone-100 border-2 border-stone-800 rounded-xl shadow-[8px_8px_0px_rgba(15,14,14,1)] overflow-hidden text-[#0F0E0E]">
          {/* OS Window Header Bar */}
          <div className="flex items-center justify-between bg-stone-800 px-4 py-2.5 text-white border-b-2 border-stone-800 select-none">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400 border border-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-yellow-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 border border-green-500"></div>
            </div>
            <span className="text-[10px] font-bold lowercase tracking-wider text-stone-300">
              {successData ? "access_granted.dat" : "early_access_request.exe"}
            </span>
            <Link href="/" className="text-xs hover:text-stone-300 font-bold font-sans">
              [x]
            </Link>
          </div>

          <AnimatePresence mode="wait">
            {!successData ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 md:p-8 flex flex-col gap-6"
              >
                <div>
                  <h1 className="font-tilt text-2xl tracking-wide lowercase border-b border-stone-300 pb-2">
                    Request early access
                  </h1>
                  <p className="text-xs text-stone-500 mt-2 font-sans">
                    Fill out the diagnostic form below. Once approved by our terminal operations, your account permissions will be unlocked.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {error && (
                    <div className="bg-red-50 border-2 border-red-400 rounded-lg p-3 text-xs text-red-700 font-sans font-medium">
                      ❌ {error}
                    </div>
                  )}

                  {/* Name field */}
                  <label className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-600">
                    Full Name
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Satoshi Nakamoto"
                      className="border-2 border-stone-800 rounded-lg bg-white px-3 py-2.5 text-xs text-[#0F0E0E] font-mono outline-none shadow-[2px_2px_0px_rgba(15,14,14,0.1)] focus:shadow-none transition-all"
                    />
                  </label>

                  {/* Mobile field */}
                  <label className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-600">
                    Mobile Number
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="e.g. +91 9988776655"
                      className="border-2 border-stone-800 rounded-lg bg-white px-3 py-2.5 text-xs text-[#0F0E0E] font-mono outline-none shadow-[2px_2px_0px_rgba(15,14,14,0.1)] focus:shadow-none transition-all"
                    />
                  </label>

                  {/* Instagram handle */}
                  <label className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-600">
                    Instagram Handle
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs text-stone-400 font-mono">@</span>
                      <input
                        type="text"
                        value={instagramUsername}
                        onChange={(e) => setInstagramUsername(e.target.value)}
                        placeholder="username"
                        className="border-2 border-stone-800 rounded-lg bg-white pl-8 pr-3 py-2.5 text-xs text-[#0F0E0E] font-mono outline-none shadow-[2px_2px_0px_rgba(15,14,14,0.1)] focus:shadow-none transition-all w-full"
                      />
                    </div>
                  </label>

                  {/* Role Selector */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                      Your Primary Role
                    </span>
                    <div className="grid grid-cols-2 gap-4">
                      {/* UGC Card */}
                      <button
                        type="button"
                        onClick={() => setRoleType("UGC")}
                        className={`flex flex-col items-start text-left p-4 border-2 rounded-xl transition-all ${
                          roleType === "UGC"
                            ? "bg-emerald-50 border-emerald-500 shadow-[3px_3px_0px_rgba(16,185,129,0.3)] translate-x-0.5"
                            : "bg-white border-stone-300 hover:border-stone-500 shadow-[2px_2px_0px_rgba(15,14,14,0.05)] hover:shadow-none"
                        }`}
                      >
                        <span className={`text-xs font-bold ${roleType === "UGC" ? "text-emerald-700" : "text-stone-800"}`}>
                          UGC Creator
                        </span>
                        <span className="text-[9px] text-stone-500 mt-1 font-sans leading-tight">
                          I record authentic bounty reels for brands.
                        </span>
                      </button>

                      {/* Clipper Card */}
                      <button
                        type="button"
                        onClick={() => setRoleType("CLIPPER")}
                        className={`flex flex-col items-start text-left p-4 border-2 rounded-xl transition-all ${
                          roleType === "CLIPPER"
                            ? "bg-blue-50 border-blue-500 shadow-[3px_3px_0px_rgba(59,130,246,0.3)] translate-x-0.5"
                            : "bg-white border-stone-300 hover:border-stone-500 shadow-[2px_2px_0px_rgba(15,14,14,0.05)] hover:shadow-none"
                        }`}
                      >
                        <span className={`text-xs font-bold ${roleType === "CLIPPER" ? "text-blue-700" : "text-stone-800"}`}>
                          Podcast Clipper
                        </span>
                        <span className="text-[9px] text-stone-500 mt-1 font-sans leading-tight">
                          I edit long-form videos into viral shorts.
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 py-3 bg-stone-800 text-white rounded-lg border-2 border-stone-800 font-bold text-xs tracking-wider uppercase hover:bg-stone-700 active:scale-[0.98] transition-all select-none shadow-[3px_3px_0px_rgba(15,14,14,0.2)] disabled:opacity-50"
                  >
                    {loading ? "Queueing Request..." : "Request System Invite"}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 md:p-8 flex flex-col gap-6 text-center"
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-emerald-500 mb-4 text-emerald-500 text-2xl font-bold">
                    ✓
                  </div>
                  <h1 className="font-tilt text-2xl tracking-wide lowercase">
                    Request queued
                  </h1>
                  <p className="text-xs text-stone-500 mt-2 font-sans max-w-sm">
                    Your request was successfully uploaded to the Merex beta ledger.
                  </p>
                </div>

                {/* Diagnostics Panel */}
                <div className="bg-stone-900 text-emerald-400 rounded-lg p-5 text-left font-mono text-[10px] leading-relaxed border border-stone-800 shadow-inner flex flex-col gap-1 select-none">
                  <div>SYSTEM ACCESS REQUEST DIAGNOSTICS:</div>
                  <div className="text-stone-500">------------------------------------</div>
                  <div>REQ_ID: <span className="text-stone-200 select-all font-sans">{successData.id}</span></div>
                  <div>NAME:   <span className="text-stone-200">{successData.name}</span></div>
                  <div>IG:     <span className="text-stone-200">@{successData.instagramUsername}</span></div>
                  <div>STATUS: <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1 rounded font-bold">PENDING REVIEW</span></div>
                  <div className="text-stone-500 mt-2">Our operations hub will verify your details and approve you shortly.</div>
                </div>

                <div className="flex justify-center gap-4 mt-2 select-none">
                  <Link
                    href="/"
                    className="px-6 py-2.5 bg-stone-800 text-white rounded-lg font-bold text-xs tracking-wider uppercase hover:bg-stone-700 active:scale-[0.98] transition-all shadow-[2px_2px_0px_rgba(15,14,14,0.15)]"
                  >
                    Back to Terminal
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between bg-stone-200/60 px-4 py-1.5 border-t-2 border-stone-800 text-[9px] text-stone-500 select-none">
            <span>SECURE ENCRYPTED HANDSHAKE</span>
            <span>SYSTEM v1.0.9</span>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-xs text-stone-500 select-none">
        © 2026 MEREX SYSTEMS. ALL RIGHTS RESERVED.
      </footer>
    </div>
  );
}
