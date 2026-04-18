"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
};

export default function Toast({ message, type = "info", onClose }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(onClose, 2800);
    return () => window.clearTimeout(id);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast ${type}`} role="status" aria-live="polite">
      <span>{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Close notification">
        x
      </button>
    </div>
  );
}
