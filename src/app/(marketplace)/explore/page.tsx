"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import type { MapBookItem } from "@/components/map/LeafletMapView";
import { POPULAR_LOCATIONS, searchLocationsBD, reverseGeocodeBD, detectLocationFromIP } from "@/lib/geo";
import { useChatWidget } from "@/context/ChatWidgetContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const LeafletMapView = dynamic(() => import("@/components/map/LeafletMapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] bg-slate-100 rounded-3xl flex items-center justify-center text-slate-500 border border-slate-200">
      <div className="flex items-center gap-2 text-xs">
        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <span>ম্যাপ লোড হচ্ছে...</span>
      </div>
    </div>
  ),
});

import {
  MapPin,
  Search,
  SlidersHorizontal,
  Layers,
  Map as MapIcon,
  Grid,
  Sparkles,
  BookOpen,
  Filter,
  Tag,
  MessageCircle,
  Navigation,
  Crosshair,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface LocationItem {
  name: string;
  lat: number;
  lon: number;
}

export default function ExplorePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { openChat } = useChatWidget();

  const [books, setBooks] = useState<MapBookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");
  const [detectingGps, setDetectingGps] = useState(false);

  // Dynamic Location State
  const [selectedLocation, setSelectedLocation] = useState<LocationItem>(POPULAR_LOCATIONS[0]);
  const [locationSearchInput, setLocationSearchInput] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<LocationItem[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Permission / Location Required Modal State
  const [showRequiredLocationModal, setShowRequiredLocationModal] = useState(false);
  const [modalSearchInput, setModalSearchInput] = useState("");
  const [modalSuggestions, setModalSuggestions] = useState<LocationItem[]>([]);
  const [permissionDeniedMsg, setPermissionDeniedMsg] = useState("");

  // Filters
  const [radiusKm, setRadiusKm] = useState<number>(300); // Default to nationwide search
  const [category, setCategory] = useState("ALL");
  const [dealType, setDealType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Save location to state and localStorage permanently
  const saveAndSetLocation = useCallback((loc: LocationItem) => {
    setSelectedLocation(loc);
    try {
      localStorage.setItem("boibinimoy_user_location", JSON.stringify(loc));
    } catch (e) {}
    setShowRequiredLocationModal(false);
    setShowLocationDropdown(false);
  }, []);

  // 🚀 AUTOMATIC LIVE GPS AUTO-COLLECT OR POPUP
  const requestLiveGPS = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      // If browser doesn't support GPS and no saved location, show modal
      const savedLoc = localStorage.getItem("boibinimoy_user_location");
      if (!savedLoc && !(user?.latitude && user?.longitude)) {
        setShowRequiredLocationModal(true);
      }
      return;
    }

    setDetectingGps(true);
    setPermissionDeniedMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // ✅ CASE A: LOCATION PERMISSION GRANTED
        // Auto-collect exact live coordinates silently
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const placeName = await reverseGeocodeBD(lat, lon);
        saveAndSetLocation({ name: placeName, lat, lon });
        setShowRequiredLocationModal(false); // No popup shown
        setDetectingGps(false);
      },
      async (err) => {
        // ❌ CASE B: LOCATION PERMISSION DENIED OR NOT SHARED
        setDetectingGps(false);

        // Check if user previously saved location or has profile location
        const saved = localStorage.getItem("boibinimoy_user_location");
        if (saved) {
          try {
            setSelectedLocation(JSON.parse(saved));
            return;
          } catch (e) {}
        }

        if (user?.latitude && user?.longitude) {
          saveAndSetLocation({
            name: user.locationName || "আমার এলাকা",
            lat: user.latitude,
            lon: user.longitude,
          });
          return;
        }

        // Try silent IP geolocation first
        const ipLoc = await detectLocationFromIP();
        if (ipLoc) {
          saveAndSetLocation(ipLoc);
          return;
        }

        // If completely unavailable, show permission required popup
        setPermissionDeniedMsg("ব্রাউজারে লোকেশন পারমিশন ব্লক বা বন্ধ রয়েছে। অনুগ্রহ করে পারমিশন Allow করুন অথবা নিচে আপনার শহর সার্চ করে সিলেক্ট করুন।");
        setShowRequiredLocationModal(true);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [user, saveAndSetLocation]);

  useEffect(() => {
    // 1. Check if user already has saved location
    try {
      const saved = localStorage.getItem("boibinimoy_user_location");
      if (saved) {
        setSelectedLocation(JSON.parse(saved));
      }
    } catch (e) {}

    // 2. Trigger auto-GPS query to silently auto-update live distance if permission is granted
    requestLiveGPS();
  }, [requestLiveGPS]);

  // Click outside to close location suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Location search in top bar
  const handleLocationSearchChange = async (val: string) => {
    setLocationSearchInput(val);
    if (val.trim().length >= 2) {
      setShowLocationDropdown(true);
      const results = await searchLocationsBD(val);
      setLocationSuggestions(results);
    } else {
      setLocationSuggestions([]);
    }
  };

  // Location search in modal
  const handleModalSearchChange = async (val: string) => {
    setModalSearchInput(val);
    if (val.trim().length >= 2) {
      const results = await searchLocationsBD(val);
      setModalSuggestions(results);
    } else {
      setModalSuggestions([]);
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "ALL") params.append("category", category);
      if (dealType !== "ALL") params.append("dealType", dealType);
      if (searchQuery) params.append("query", searchQuery);
      params.append("lat", selectedLocation.lat.toString());
      params.append("lon", selectedLocation.lon.toString());
      params.append("maxDistance", radiusKm.toString());

      const res = await fetch(`/api/books?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setBooks(data.books || []);
      }
    } catch (err) {
      console.error("Explore fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [selectedLocation, radiusKm, category, dealType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks();
  };

  // Open Facebook-style floating chat widget in bottom right
  const handleOpenChatWidget = (book: any) => {
    if (!user) {
      router.push(`/login?redirect=/explore`);
      return;
    }

    const sellerId = book.userId || book.user?.id;
    if (sellerId === user.id) {
      router.push("/my-books");
      return;
    }

    openChat({
      bookId: book.id,
      sellerId: sellerId,
      bookTitle: book.title,
      bookPrice: book.price,
      bookImage: book.images?.[0],
      sellerName: book.user?.name || "বিক্রেতা",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        {/* Search and Area Row */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Query */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="বইয়ের নাম, লেখক বা বিষয় দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden text-sm bg-white"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              খুঁজুন
            </button>
          </form>

          {/* DYNAMIC SEARCHABLE LOCATION HUB & LIVE GPS SELECTOR */}
          <div ref={dropdownRef} className="relative min-w-[300px] flex items-center gap-2">
            <div className="relative flex-1">
              <div
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className="w-full py-2.5 px-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center justify-between gap-1.5 transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{selectedLocation.name}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </div>

              {/* DROPDOWN WITH DYNAMIC SEARCH & POPULAR HUBS */}
              {showLocationDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 space-y-2 animate-in fade-in">
                  {/* Dynamic Search Box */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="যেকোনো জেলা/থানা লিখে খুঁজুন (যেমন: বগুড়া, সিলেট, খুলনা)..."
                      value={locationSearchInput}
                      onChange={(e) => handleLocationSearchChange(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-hidden focus:border-emerald-500 bg-slate-50"
                      autoFocus
                    />
                  </div>

                  {/* Dynamic Search Suggestions */}
                  {locationSuggestions.length > 0 && (
                    <div className="space-y-1 border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                        সার্চ ফলাফল (OpenStreetMap):
                      </span>
                      {locationSuggestions.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => saveAndSetLocation(item)}
                          className="w-full text-left p-2 rounded-lg hover:bg-emerald-50 text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Popular Hubs */}
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                      জনপ্রিয় এলাকা ও ক্যাম্পাস:
                    </span>
                    {POPULAR_LOCATIONS.map((loc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => saveAndSetLocation(loc)}
                        className={`w-full text-left p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          selectedLocation.name === loc.name
                            ? "bg-emerald-100 text-emerald-900 font-bold"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{loc.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 1-Tap Live GPS Button */}
            <button
              type="button"
              onClick={requestLiveGPS}
              disabled={detectingGps}
              title="আমার বর্তমান লাইভ জিপিএস শনাক্ত করুন"
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs transition-colors"
            >
              {detectingGps ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Crosshair className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">লাইভ GPS</span>
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl shrink-0">
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "map"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              ম্যাপ ভিউ
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "grid"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              গ্রিড ভিউ
            </button>
          </div>
        </div>

        {/* Distance Slider & Categories */}
        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Distance Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              রেডিয়াস দূরত্ব:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { dist: 5, label: "৫ কিমি" },
                { dist: 15, label: "১৫ কিমি" },
                { dist: 50, label: "৫০ কিমি" },
                { dist: 300, label: "সারাদেশ (সব দূরত্ব)" },
              ].map(({ dist, label }) => (
                <button
                  key={dist}
                  onClick={() => setRadiusKm(dist)}
                  className={`px-3 py-1 text-xs rounded-xl font-bold transition-all ${
                    radiusKm === dist
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Deal Type Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: "ALL", label: "সকল বই" },
              { id: "SELL", label: "বিক্রয় (৳)" },
              { id: "SWAP", label: "বিনিময় (Swap)" },
              { id: "GIVEAWAY", label: "ফ্রি গিভঅ্যাওয়ে" },
            ].map((deal) => (
              <button
                key={deal.id}
                onClick={() => setDealType(deal.id)}
                className={`px-3 py-1 text-xs rounded-xl font-bold whitespace-nowrap transition-all ${
                  dealType === deal.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {deal.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 text-xs">
          {[
            { id: "ALL", label: "সব ক্যাটাগরি" },
            { id: "ACADEMIC_ENG", label: "ইঞ্জিনিয়ারিং" },
            { id: "ACADEMIC_MED", label: "মেডিকেল" },
            { id: "ACADEMIC_COLLEGE", label: "স্কুল ও কলেজ" },
            { id: "BCS_JOB", label: "বিসিএস ও চাকরি প্রস্তুতি" },
            { id: "FICTION", label: "ফিকশন / গল্প" },
            { id: "NON_FICTION", label: "নন-ফিকশন" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                category === cat.id
                  ? "bg-emerald-100 text-emerald-800 font-bold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area: Map + Side List OR Full Grid */}
      {viewMode === "map" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map Canvas (7 cols) */}
          <div className="lg:col-span-7 h-[500px] lg:h-[620px] sticky top-20">
            <LeafletMapView
              books={books}
              centerLat={selectedLocation.lat}
              centerLon={selectedLocation.lon}
              radiusKm={radiusKm}
            />
          </div>

          {/* Filtered Books List (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5 max-h-[620px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>📍 {selectedLocation.name}-এর সাপেক্ষে</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {books.length} টি বই
                </span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {radiusKm >= 300 ? "সারাদেশ" : `${radiusKm} কিমির মধ্যে`}
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <span className="text-xs">বই খোঁজা হচ্ছে...</span>
              </div>
            ) : books.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-600">এই দূরত্বের মধ্যে কোনো বই পাওয়া যায়নি</p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setRadiusKm(300)}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100"
                  >
                    সারাদেশের সব বই দেখুন
                  </button>
                </div>
              </div>
            ) : (
              books.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl border border-slate-200 p-3 flex gap-3 hover:shadow-md hover:border-emerald-300 transition-all group"
                >
                  <Link href={`/books/${book.id}`} className="shrink-0">
                    <img
                      src={book.images?.[0] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"}
                      alt={book.title}
                      className="w-20 h-24 rounded-xl object-cover bg-slate-100 group-hover:scale-105 transition-transform"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            book.dealType === "SELL"
                              ? "bg-emerald-100 text-emerald-800"
                              : book.dealType === "SWAP"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {book.dealType === "SELL"
                            ? `৳${book.price}`
                            : book.dealType === "SWAP"
                            ? "বিনিময়"
                            : "ফ্রি"}
                        </span>
                        {book.distance !== undefined && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            book.distance <= 5
                              ? "bg-emerald-50 text-emerald-700"
                              : book.distance <= 50
                              ? "bg-blue-50 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            📍 {book.distance} কিমি দূরে
                          </span>
                        )}
                      </div>

                      <Link href={`/books/${book.id}`}>
                        <h3 className="text-xs font-bold text-slate-900 line-clamp-1 hover:text-emerald-700 transition-colors">
                          {book.title}
                        </h3>
                      </Link>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{book.author}</p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100">
                      <span className="text-slate-400 truncate max-w-[120px]">
                        📌 {book.approxLocation || "ক্যাম্পাস"}
                      </span>

                      {/* Floating Chat Box Trigger */}
                      <button
                        type="button"
                        onClick={() => handleOpenChatWidget(book)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        চ্যাট ও অফার →
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Full Grid Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col group"
            >
              <Link href={`/books/${book.id}`} className="relative h-48 bg-slate-100 overflow-hidden block">
                <img
                  src={book.images?.[0] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs ${
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
                      ? "বিনিময়"
                      : "ফ্রি"}
                  </span>
                </div>
                {book.distance !== undefined && (
                  <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    📍 {book.distance} কিমি দূরে
                  </div>
                )}
              </Link>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <Link href={`/books/${book.id}`}>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mb-1 hover:text-emerald-700 transition-colors">
                      {book.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500 mb-2">{book.author}</p>
                </div>
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 truncate max-w-[110px]">
                    📌 {book.approxLocation}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenChatWidget(book)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    চ্যাট ও অফার
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🎯 LOCATION PERMISSION REQUIRED MODAL (ONLY APPEARS IF GPS PERMISSION IS NOT SHARED / DENIED) */}
      {showRequiredLocationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                লোকেশন পারমিশন প্রয়োজন
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                আপনার এলাকার ১-৫ কিমির মধ্যে বই ও শিক্ষার্থীদের খুঁজে পেতে অনুগ্রহ করে লাইভ জিপিএস লোকেশন শেয়ার করুন অথবা আপনার শহর নির্বাচন করুন।
              </p>
            </div>

            {permissionDeniedMsg && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{permissionDeniedMsg}</span>
              </div>
            )}

            {/* Action 1: 1-Tap Auto GPS */}
            <button
              type="button"
              onClick={requestLiveGPS}
              disabled={detectingGps}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              {detectingGps ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Crosshair className="w-4 h-4" />
              )}
              <span>বর্তমান জিপিএস লোকেশন শেয়ার করুন (Allow GPS)</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase">
                অথবা আপনার শহর সার্চ করুন
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Action 2: Dynamic Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="যেকোনো জেলা বা থানার নাম লিখুন (যেমন: বগুড়া, সিলেট, খুলনা)..."
                  value={modalSearchInput}
                  onChange={(e) => handleModalSearchChange(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-hidden focus:border-emerald-500 bg-slate-50"
                  autoFocus
                />
              </div>

              {/* Modal Search Suggestions */}
              {modalSuggestions.length > 0 && (
                <div className="space-y-1 bg-slate-50 rounded-xl p-2 max-h-36 overflow-y-auto border border-slate-200">
                  {modalSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => saveAndSetLocation(item)}
                      className="w-full text-left p-2 rounded-lg hover:bg-emerald-100 text-xs font-semibold text-slate-900 flex items-center gap-2 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Popular 1-Tap District Chips */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 block">
                জনপ্রিয় জেলা ও ক্যাম্পাস:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {POPULAR_LOCATIONS.map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => saveAndSetLocation(loc)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 text-[11px] font-semibold transition-colors"
                  >
                    📍 {loc.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
