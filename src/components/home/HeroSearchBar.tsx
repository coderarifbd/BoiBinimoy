"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Sparkles, ArrowRight, BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface SuggestedBook {
  id: string;
  title: string;
  author: string;
  price: number;
  dealType: string;
  condition: string;
  approxLocation?: string;
  images: string[];
  distance?: number;
  user?: {
    name: string;
    locationName?: string;
  };
}

export default function HeroSearchBar() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestedBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Get user coords from localStorage or geolocation
  useEffect(() => {
    try {
      const saved = localStorage.getItem("boibinimoy_user_location");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lat && parsed.lon) {
          setUserCoords({ lat: parsed.lat, lon: parsed.lon });
          return;
        }
      }
    } catch (e) {}

    if (user?.latitude && user?.longitude) {
      setUserCoords({ lat: user.latitude, lon: user.longitude });
      return;
    }

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        () => {
          // Default Dhaka center
          setUserCoords({ lat: 23.726, lon: 90.398 });
        },
        { timeout: 5000 }
      );
    }
  }, [user]);

  // 2. Fetch live suggestions when user types with distance sorting
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        let url = `/api/books?query=${encodeURIComponent(trimmed)}`;
        if (userCoords?.lat && userCoords?.lon) {
          url += `&lat=${userCoords.lat}&lon=${userCoords.lon}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setSuggestions((data.books || []).slice(0, 8)); // Closest matches
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Suggestion error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, userCoords]);

  // 3. Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    router.push(`/explore?query=${encodeURIComponent(query.trim())}`);
  };

  const formatDistance = (dist?: number) => {
    if (dist === undefined || dist === null) return null;
    if (dist < 1) {
      return `${Math.round(dist * 1000)} মি দূরে`;
    }
    return `${dist.toFixed(1)} কিমি দূরে`;
  };

  return (
    <div ref={containerRef} className="relative max-w-2xl mx-auto pt-3 z-50">
      {/* Clean Single Search Form without Map View button */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white dark:bg-slate-900/95 p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-black/50 flex items-center gap-2 hover:border-emerald-400 dark:hover:border-emerald-500/60 transition-all backdrop-blur-md"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0 px-3 py-1 sm:py-0">
          {loading ? (
            <Loader2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-spin shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen && e.target.value.trim().length >= 2) setIsOpen(true);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            placeholder="বইয়ের নাম, লেখক বা বিষয় দিয়ে খুঁজুন..."
            className="w-full text-sm sm:text-base outline-hidden text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setIsOpen(false);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1 shrink-0 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="submit"
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl sm:rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer shrink-0"
        >
          <Search className="w-4 h-4" />
          <span>খুঁজুন</span>
        </button>
      </form>

      {/* 🚀 DYNAMIC-HEIGHT AUTO-SUGGESTION DROPDOWN (Adapts height to results with max-height & scrollbar) */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 flex flex-col h-auto max-h-[380px]">
          {/* Compact Header */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <span className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              নিকটস্থ ফলাফল (দূরত্ব অনুযায়ী সাজানো)
            </span>
            <span>{suggestions.length} টি বই পাওয়া গেছে</span>
          </div>

          {/* Dynamic Scrollable Result List */}
          {suggestions.length === 0 ? (
            <div className="p-5 text-center text-slate-500 dark:text-slate-400 space-y-1">
              <BookOpen className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-1" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                "{query}" নামের কোনো বই পাওয়া যায়নি
              </p>
              <p className="text-xs">বানান চেক করুন অথবা ভিন্ন শব্দ দিয়ে সার্চ করুন।</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 overflow-y-auto flex-1 overscroll-contain">
              {suggestions.map((book) => {
                const distanceStr = formatDistance(book.distance);

                return (
                  <Link
                    key={book.id}
                    href={`/books/${book.id}`}
                    onClick={() => setIsOpen(false)}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-emerald-50/60 dark:hover:bg-slate-800/70 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={
                          book.images?.[0] ||
                          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=80"
                        }
                        alt={book.title}
                        className="w-10 h-13 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                      />

                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {book.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {book.author}
                        </p>

                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {distanceStr && (
                            <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {distanceStr}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
                            📍 {book.approxLocation || "ক্যাম্পাস"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-black shadow-2xs ${
                          book.dealType === "SELL"
                            ? "bg-emerald-600 text-white"
                            : book.dealType === "SWAP"
                            ? "bg-blue-600 text-white"
                            : "bg-amber-600 text-white"
                        }`}
                      >
                        {book.dealType === "SELL"
                          ? `৳${book.price}`
                          : book.dealType === "SWAP"
                          ? "সোয়াপ"
                          : "ফ্রি"}
                      </span>
                      <span className="text-[10px] text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-0.5 font-bold">
                        দেখুন <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Compact Footer */}
          <div className="p-2 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 text-center shrink-0">
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="w-full py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>সকল ফলাফল এক্সপ্লোর করুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
