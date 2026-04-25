"use client";

import { useState } from "react";

type CompsPayload = {
  avg: number;
  min: number;
  max: number;
  prices: number[];
};

type CardCompsApiOk = {
  query: string;
  source?: "live" | "dev-mock";
  comps: CompsPayload;
};

function money(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function friendlyError(status: number, message: string | undefined) {
  if (status === 400) {
    return message || "Add a search term to look up recent sold prices.";
  }
  if (status === 404) {
    return message
      ? String(message)
      : "We couldn’t find comp prices for that search. Try a different name or check back later.";
  }
  if (message) return String(message);
  return "Something went wrong. Please try again.";
}

export function CardCompsTest() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CardCompsApiOk | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const q = input.trim();
    if (!q) {
      setError("Enter a card name (for example: charizard psa 10).");
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(
        `/api/card-comps?q=${encodeURIComponent(q)}`,
        { cache: "no-store" }
      );
      const json = (await res.json()) as
        | CardCompsApiOk
        | { error?: string };
      if (!res.ok) {
        setError(
          friendlyError(
            res.status,
            "error" in json ? json.error : undefined
          )
        );
        return;
      }
      if (!("comps" in json)) {
        setError("Unexpected response. Please try again.");
        return;
      }
      setData(json);
    } catch {
      setError("Can’t reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="mt-6 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-6"
      aria-labelledby="card-comps-title"
    >
      <h2
        id="card-comps-title"
        className="text-sm font-bold uppercase tracking-wide text-amber-400/90"
      >
        Recent sold prices
      </h2>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
        Search public sale comps before you scan or submit a card for grading.
      </p>

      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="e.g. luka doncic prizm rookie"
          className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-sm text-zinc-100 shadow-sm placeholder:text-zinc-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-amber shrink-0 flex h-12 items-center justify-center rounded-xl px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Checking…" : "Get comps"}
        </button>
      </form>

      {error && (
        <p
          className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200/95"
          role="alert"
        >
          {error}
        </p>
      )}

      {data && (
        <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4 text-sm text-zinc-300">
          {data.source === "dev-mock" && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs font-medium text-amber-200/95">
              Demo pricing shown — live data unavailable locally
            </p>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <p>
              <span className="block text-xs text-zinc-500">Source</span>
              <span className="text-zinc-100">
                {data.source === "dev-mock"
                  ? "Dev mock (local)"
                  : "Public sold listings"}
              </span>
            </p>
            <p>
              <span className="block text-xs text-zinc-500">Query</span>
              <span className="text-zinc-100">{data.query}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 sm:grid-cols-3">
            <p>
              <span className="block text-xs text-zinc-500">Average</span>
              <span className="font-mono text-base text-white">
                ${money(data.comps.avg)}
              </span>
            </p>
            <p>
              <span className="block text-xs text-zinc-500">Min price</span>
              <span className="font-mono text-base text-white">
                ${money(data.comps.min)}
              </span>
            </p>
            <p>
              <span className="block text-xs text-zinc-500">Max price</span>
              <span className="font-mono text-base text-white">
                ${money(data.comps.max)}
              </span>
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">Recent prices</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {data.comps.prices.map((p, i) => (
                <li
                  key={`${i}-${p}`}
                  className="rounded-md border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 font-mono text-xs text-zinc-200"
                >
                  ${money(p)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
