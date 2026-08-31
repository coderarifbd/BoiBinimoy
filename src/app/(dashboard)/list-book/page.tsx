"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { compressImageToWebP } from "@/lib/image-compress";
import { POPULAR_LOCATIONS, searchLocationsBD, reverseGeocodeBD } from "@/lib/geo";
import {
  UploadCloud,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  DollarSign,
  Repeat,
  Gift,
  Image as ImageIcon,
  AlertCircle,
  FileCheck,
  MapPin,
  Crosshair,
  Search,
} from "lucide-react";

export default function ListBookPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [images, setImages] = useState<string[]>([]);
  const [imageMeta, setImageMeta] = useState<{ original: number; compressed: number }[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("ACADEMIC_ENG");
  const [condition, setCondition] = useState("LIKE_NEW");
  const [dealType, setDealType] = useState("SELL"); // SELL | SWAP | GIVEAWAY
  const [price, setPrice] = useState("");

  // Dynamic Location State
  const [locationName, setLocationName] = useState(user?.locationName || "বগুড়া শহর (Bogura)");
  const [latitude, setLatitude] = useState<number>(user?.latitude || 24.8465);
  const [longitude, setLongitude] = useState<number>(user?.longitude || 89.3777);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{ name: string; lat: number; lon: number }>>([]);
  const [detectingGps, setDetectingGps] = useState(false);

  // Detect GPS on mount if not set
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation && !user?.latitude) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLatitude(lat);
          setLongitude(lon);
          const name = await reverseGeocodeBD(lat, lon);
          setLocationName(name);
        },
        () => {},
        { timeout: 6000 }
      );
    }
  }, [user]);

  // Live GPS Fetch handler
  const handleFetchGps = () => {
    if (!navigator.geolocation) {
      alert("জিপিএস পারমিশন পাওয়া যায়নি");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);
        const name = await reverseGeocodeBD(lat, lon);
        setLocationName(name);
        setLocationSearchQuery("");
        setLocationSuggestions([]);
        setDetectingGps(false);
      },
      (err) => {
        setDetectingGps(false);
        alert("লোকেশন পারমিশন পাওয়া যায়নি। নিচে সার্চ করে আপনার এলাকা নির্বাচন করুন।");
      },
      { timeout: 10000 }
    );
  };

  const handleLocationSearch = async (query: string) => {
    setLocationSearchQuery(query);
    if (query.trim().length >= 2) {
      const results = await searchLocationsBD(query);
      setLocationSuggestions(results);
    } else {
      setLocationSuggestions([]);
    }
  };

  // Step 1: Image Selection and WebP Client Compression (<500KB)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setError("");

    const files = Array.from(e.target.files);
    try {
      const newImages: string[] = [];
      const newMeta: { original: number; compressed: number }[] = [];

      for (const file of files) {
        const compressed = await compressImageToWebP(file, 450); // <450KB WebP
        newImages.push(compressed.dataUrl);
        newMeta.push({
          original: compressed.originalSizeKB,
          compressed: compressed.compressedSizeKB,
        });
      }

      setImages([...images, ...newImages].slice(0, 3));
      setImageMeta([...imageMeta, ...newMeta].slice(0, 3));
    } catch (err) {
      console.error(err);
      setError("ছবি কম্প্রেশন করতে সমস্যা হয়েছে। অনুগ্রহ করে অন্য ছবি চেষ্টা করুন।");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImageMeta(imageMeta.filter((_, i) => i !== index));
  };

  // Step 3: 1-Tap Submit & Publish
  const handlePublish = async () => {
    if (!user) {
      router.push("/login?redirect=/list-book");
      return;
    }

    if (!title.trim()) {
      setError("বইয়ের নাম দিন");
      setStep(2);
      return;
    }

    if (dealType === "SELL" && (!price || parseFloat(price) <= 0)) {
      setError("সঠিক বিক্রয়মূল্য (টাকা) উল্লেখ করুন");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Upload Images to Cloudinary / Server
      const uploadedImageUrls: string[] = [];
      for (const imgBase64 of images) {
        if (imgBase64.startsWith("data:")) {
          const upRes = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64Image: imgBase64, folder: "boibinimoy_books" }),
          });
          const upData = await upRes.json();
          if (upRes.ok && upData.url) {
            uploadedImageUrls.push(upData.url);
          } else {
            uploadedImageUrls.push(imgBase64); // Fallback
          }
        } else {
          uploadedImageUrls.push(imgBase64);
        }
      }

      // 2. Publish Book to Database with dynamic GPS latitude & longitude
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          category,
          condition,
          dealType,
          price: dealType === "SELL" ? price : "0",
          images: uploadedImageUrls,
          approxLocation: locationName,
          latitude,
          longitude,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "বই প্রকাশ করতে ব্যর্থ হয়েছে");
      }

      // Redirect to Inventory
      router.push("/my-books?posted=true");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="text-center space-y-2 mb-8">
        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
          সহজ ৩ ধাপ
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          আপনার বই পোস্ট করুন
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          আপনার পুরাতন বা অতিরিক্ত বইটি অন্য পাঠকদের সাথে সেল, সোয়াপ বা দান করুন।
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
        <div
          className={`p-2.5 rounded-xl border text-center transition-all ${
            step === 1
              ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs"
              : step > 1
              ? "border-emerald-200 bg-emerald-500/10 text-emerald-700 font-medium"
              : "border-slate-200 bg-white text-slate-400"
          }`}
        >
          <span className="text-xs block">স্টেপ ১</span>
          <span className="text-xs sm:text-sm font-semibold">ছবি আপলোড</span>
        </div>

        <div
          className={`p-2.5 rounded-xl border text-center transition-all ${
            step === 2
              ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs"
              : step > 2
              ? "border-emerald-200 bg-emerald-500/10 text-emerald-700 font-medium"
              : "border-slate-200 bg-white text-slate-400"
          }`}
        >
          <span className="text-xs block">স্টেপ ২</span>
          <span className="text-xs sm:text-sm font-semibold">বই ও লোকেশন</span>
        </div>

        <div
          className={`p-2.5 rounded-xl border text-center transition-all ${
            step === 3
              ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs"
              : "border-slate-200 bg-white text-slate-400"
          }`}
        >
          <span className="text-xs block">স্টেপ ৩</span>
          <span className="text-xs sm:text-sm font-semibold">প্রাইস ও প্রকাশ</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
        {/* ================= STEP 1: IMAGE UPLOAD & WEBP AUTO-COMPRESSION ================= */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                বইয়ের পরিষ্কার ছবি তুলুন বা সিলেক্ট করুন
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                ব্রাউজারেই স্বয়ংক্রিয়ভাবে সাইজ কমে <span className="font-semibold text-emerald-700">WebP ফরম্যাট (&lt;500KB)</span> হয়ে আপলোড হবে। (সর্বোচ্চ ৩টি ছবি)
              </p>
            </div>

            {/* Upload Area */}
            <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-emerald-50/40 hover:bg-emerald-50/80 transition-all group">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform mb-3">
                <UploadCloud className="w-7 h-7" />
              </div>
              <span className="text-sm font-bold text-slate-800">
                ছবি নির্বাচন করতে ক্লিক বা ড্রপ করুন
              </span>
              <span className="text-xs text-slate-500 mt-1">
                JPG, PNG বা সরাসরি ক্যামেরা ফটো (Auto WebP Fast Compression)
              </span>
            </label>

            {/* Previews with compression stats */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={img}
                      alt="Preview"
                      className="w-full h-28 sm:h-36 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1.5 right-1.5 p-1 bg-slate-900/80 hover:bg-rose-600 text-white rounded-lg text-xs transition-colors"
                    >
                      ✕
                    </button>
                    {imageMeta[idx] && (
                      <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 text-white text-[10px] py-1 px-1.5 flex items-center justify-between">
                        <span className="text-slate-400 line-through">
                          {imageMeta[idx].original}KB
                        </span>
                        <span className="text-emerald-400 font-bold">
                          {imageMeta[idx].compressed}KB WebP
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  if (images.length === 0) {
                    setError("কমপক্ষে ১টি বইয়ের ছবি আপলোড করুন");
                    return;
                  }
                  setError("");
                  setStep(2);
                }}
                disabled={images.length === 0}
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
              >
                পরবর্তী ধাপ: বইয়ের বিবরণ
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: BOOK DETAILS & DYNAMIC GPS LOCATION ================= */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                বইয়ের মৌলিক তথ্য ও অবস্থান
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                সঠিক তথ্য ও লোকেশন দিলে আপনার এলাকার আগ্রহী পাঠকেরা সহজেই আপনার বইটি খুঁজে পাবে
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                বইয়ের নাম *
              </label>
              <input
                type="text"
                placeholder="যেমন: Fundamentals of Electric Circuits / প্রফেসরস বিসিএস"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  লেখক / পাবলিকেশন
                </label>
                <input
                  type="text"
                  placeholder="যেমন: Charles Alexander / হুমায়ূন আহমেদ"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ক্যাটাগরি *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden text-sm bg-white"
                >
                  <option value="ACADEMIC_ENG">একাডেমিক - ইঞ্জিনিয়ারিং</option>
                  <option value="ACADEMIC_MED">একাডেমিক - মেডিকেল</option>
                  <option value="ACADEMIC_COLLEGE">স্কুল / কলেজ / এইচএসসি</option>
                  <option value="BCS_JOB">বিসিএস ও চাকরি প্রস্তুতি</option>
                  <option value="FICTION">ফিকশন / উপন্যাস / সাহিত্য</option>
                  <option value="NON_FICTION">নন-ফিকশন / সেলফ-হেল্প / ইতিহাস</option>
                  <option value="OTHER">অন্যান্য</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                বইয়ের বর্তমান কন্ডিশন *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "NEW", label: "New (একদম নতুন)" },
                  { id: "LIKE_NEW", label: "Like New (খুব ফ্রেশ)" },
                  { id: "GOOD", label: "Good (ভালো অবস্থা)" },
                  { id: "ACCEPTABLE", label: "Acceptable (পড়ার উপযোগী)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCondition(item.id)}
                    className={`py-2 px-2.5 text-xs rounded-xl border text-center transition-all ${
                      condition === item.id
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold ring-2 ring-emerald-500/20"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* DYNAMIC GPS & LOCATION SELECTION */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  বইটির অবস্থান / এরিয়া *
                </label>
                <button
                  type="button"
                  onClick={handleFetchGps}
                  disabled={detectingGps}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                >
                  {detectingGps ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Crosshair className="w-3.5 h-3.5" />
                  )}
                  <span>বর্তমান লাইভ GPS লোকেশন নিন</span>
                </button>
              </div>

              {/* Current Address Input */}
              <input
                type="text"
                placeholder="এলাকার নাম বা ল্যান্ডমার্ক (যেমন: সাতমাথা, বগুড়া / ধানমন্ডি ২৭)"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-sm outline-hidden focus:border-emerald-500 bg-white"
                required
              />

              {/* Dynamic Search Autocomplete */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="অন্য কোনো জেলা বা থানা সার্চ করুন (যেমন: বগুড়া সদর, সিলেট, রংপুর)..."
                  value={locationSearchQuery}
                  onChange={(e) => handleLocationSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-hidden focus:border-emerald-500 bg-white"
                />
              </div>

              {/* Suggestions list */}
              {locationSuggestions.length > 0 && (
                <div className="space-y-1 bg-white border border-slate-200 rounded-xl p-2 max-h-40 overflow-y-auto shadow-sm">
                  {locationSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLocationName(item.name);
                        setLatitude(item.lat);
                        setLongitude(item.lon);
                        setLocationSearchQuery("");
                        setLocationSuggestions([]);
                      }}
                      className="w-full text-left p-1.5 rounded-lg hover:bg-emerald-50 text-xs font-medium text-slate-800 flex items-center gap-1.5 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span>কোঅর্ডিনেটস:</span>
                <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </span>
                <span className="text-emerald-700 font-medium">✓ ম্যাপে রিয়েল দূরত্ব মাপতে ব্যবহৃত হবে</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-1 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                পেছনে
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!title.trim()) {
                    setError("বইয়ের নাম উল্লেখ করুন");
                    return;
                  }
                  setError("");
                  setStep(3);
                }}
                className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
              >
                পরবর্তী ধাপ: ডিল টাইপ ও প্রাইস
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: DEAL TYPE (SELL / SWAP / GIVEAWAY) & 1-TAP PUBLISH ================= */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                ডিলের ধরন এবং মূল্য নির্ধারণ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                বইটি বিক্রি করতে চান, নাকি অন্য বইয়ের সাথে বদল (Swap) করবেন?
              </p>
            </div>

            {/* Deal Type Selector (3 options) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setDealType("SELL")}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  dealType === "SELL"
                    ? "border-emerald-600 bg-emerald-50/50 shadow-md shadow-emerald-600/10"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">বিক্রি করব (Sell)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  একটি নির্দিষ্ট মূল্যে বিক্রি করতে চান
                </p>
              </div>

              <div
                onClick={() => setDealType("SWAP")}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  dealType === "SWAP"
                    ? "border-blue-600 bg-blue-50/50 shadow-md shadow-blue-600/10"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2 font-bold">
                  <Repeat className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">বিনিময় করব (Swap)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  অন্য কোনো বইয়ের বিনিময়ে হাতবদল
                </p>
              </div>

              <div
                onClick={() => setDealType("GIVEAWAY")}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  dealType === "GIVEAWAY"
                    ? "border-amber-600 bg-amber-50/50 shadow-md shadow-amber-600/10"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2 font-bold">
                  <Gift className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">ফ্রি গিভঅ্যাওয়ে</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  কোনো জুনিয়র বা অভাবী শিক্ষার্থীকে দান
                </p>
              </div>
            </div>

            {/* Price Input (Only for SELL) */}
            {dealType === "SELL" && (
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <label className="block text-xs font-bold text-emerald-900">
                  আপনার বিক্রয়মূল্য (টাকা) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                    ৳
                  </span>
                  <input
                    type="number"
                    placeholder="যেমন: 250"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-emerald-300 font-black text-lg text-slate-900 outline-hidden focus:border-emerald-600 bg-white"
                    required
                  />
                </div>
                <span className="text-[11px] text-emerald-700 block">
                  💡 ন্যায্য মূল্য দিলে দ্রুত বিক্রি হওয়ার সম্ভাবনা বেশি থাকে।
                </span>
              </div>
            )}

            {/* Summary Review Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">বইয়ের নাম:</span>
                <span className="font-bold text-slate-900">{title}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">অবস্থান:</span>
                <span className="font-bold text-slate-900">📍 {locationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">মোট ছবি:</span>
                <span className="font-bold text-emerald-700">{images.length}টি ফটো প্রস্তুত</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={loading}
                className="py-3 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-1 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                পেছনে
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={loading}
                className="flex-1 py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>পাবলিশ করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-5 h-5" />
                    <span>১-ট্যাপে পোস্ট সম্পন্ন করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
