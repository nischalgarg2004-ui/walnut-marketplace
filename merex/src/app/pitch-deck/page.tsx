import { Metadata } from "next";
import PitchDeckScroll from "@/components/PitchDeckScroll";

export const metadata: Metadata = {
  title: "Merex — Pitch Deck",
  description: "Programmable fame. The operating system for creator-brand collaborations. Built for VCs and strategic partners.",
};

export default function PitchDeckPage() {
  return <PitchDeckScroll />;
}
