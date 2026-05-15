"use client";

import { useState, useRef, useEffect } from "react";

const CATEGORY_COLORS: Record<string, string> = {
  // 주식 기본
  국내주식: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  해외주식: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ETF: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  배당주: "bg-green-500/20 text-green-400 border-green-500/30",
  성장주: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  // 동동이 커스텀
  "Bucket A": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Bucket B": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "매크로 헤지": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  위성: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Scout: "bg-green-500/20 text-green-400 border-green-500/30",
  두나무: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  BN: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "적립(비투자)": "bg-gray-500/20 text-gray-400 border-gray-500/30",
  // 크립토
  "Layer 1": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Layer 2": "bg-sky-500/20 text-sky-400 border-sky-500/30",
  DeFi: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  스테이블코인: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  밈: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

export function getCategoryColor(label: string): string {
  return CATEGORY_COLORS[label] ?? "bg-muted text-muted-foreground border-border";
}

export function Badge({ label }: { label: string }) {
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(label)}`}>{label}</span>;
}

export default function CategoryPicker({ value, onChange, allCategories }: { value: string; onChange: (v: string) => void; allCategories: string[] }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${getCategoryColor(value)}`}
      >
        {value}
        <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => { onChange(cat); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted/50 flex items-center gap-2 ${cat === value ? "font-bold" : ""}`}
            >
              <span className={`w-2 h-2 rounded-full ${(CATEGORY_COLORS[cat] ?? "bg-muted").split(" ")[0]}`} />
              {cat}
            </button>
          ))}
          <div className="border-t border-border mt-1 pt-1">
            {adding ? (
              <div className="px-2 py-1 flex gap-1">
                <input
                  className="flex-1 bg-muted/50 rounded px-2 py-1 text-xs"
                  placeholder="새 카테고리"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCat.trim()) {
                      onChange(newCat.trim());
                      setNewCat("");
                      setAdding(false);
                      setOpen(false);
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (newCat.trim()) {
                      onChange(newCat.trim());
                      setNewCat("");
                      setAdding(false);
                      setOpen(false);
                    }
                  }}
                  className="text-xs px-2 py-1 rounded bg-emerald-600 text-white"
                >
                  추가
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50"
              >
                + 새 카테고리
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
