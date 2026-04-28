"use client";

import { useState } from "react";

type Props = {
  scanId?: string;
  source?: "scan_result" | "pre_paywall" | "pricing";
  title?: string;
  description?: string;
  ctaLabel?: string;
  successMessage?: string;
};

export function EmailCapture({
  scanId,
  source = "scan_result",
  title = "Get your full grading analysis emailed to you — free",
  description = "We'll send this result plus a breakdown of why. No spam.",
  ctaLabel = "Send",
  successMessage = "Sent! Check your inbox for your full grading analysis.",
}: Props) {
  const [email, setEmail] = useState("");
  const [picks, setPicks] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  if (status === "done") {
    return (
      <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-center text-sm text-emerald-400">
        ✓ {successMessage}
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/capture-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, picks, scanId, source }),
      });
      if (res.ok) {
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-4 space-y-3"
    >
      <p className="text-sm font-semibold text-white">
        {title}
      </p>
      <p className="text-xs text-zinc-400 leading-relaxed">
        {description}
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-amber-500/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
        >
          {status === "loading" ? "…" : ctaLabel}
        </button>
      </div>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={picks}
          onChange={(e) => setPicks(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-400"
        />
        <span className="text-xs text-zinc-400">
          Optionally send me monthly high-ROI grading picks
        </span>
      </label>
      {status === "error" && (
        <p className="text-xs text-red-400">Something went wrong. Try again.</p>
      )}
    </form>
  );
}
