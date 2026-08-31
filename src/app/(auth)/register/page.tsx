"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { POPULAR_LOCATIONS, searchLocationsBD, reverseGeocodeBD } from "@/lib/geo";
import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  AlertCircle,
  Gift,
  MapPin,
  Crosshair,
  Search,
} from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, refreshUser } = useAuth();

  const refParam = searchParams.get("ref") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Dynamic Location State
  const [locationName, setLocationName] = useState("বগুড়া শহর (Bogura)");
  const [latitude, setLatitude] = useState(24.8465);
  const [longitude, setLongitude] = useState(89.3777);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{ name: string; lat: number; lon: number }>>([]);
  const [detectingGps, setDetectingGps] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-detect GPS coordinates on mount
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
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
        { timeout: 5000 }
      );
    }
  }, []);

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
        alert("লোকেশন পারমিশন পাওয়া যায়নি। নিচে সার্চ করে আপনার এলাকা সিলেক্ট করুন।");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          locationName,
          latitude,
          longitude,
          referredByCode: refParam || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "রেজিস্ট্রেশন করতে ব্যর্থ হয়েছে");
      }

      if (data.user) {
        login(data.user);
      }
      await refreshUser();
      router.push("/explore");
    } catch (err: any) {
      setError(err.message || "রেজিস্ট্রেশন করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-500/20">
          <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">অ্যাকাউন্ট খুলুন</h1>
        <p className="text-xs text-slate-500">বই বিনিময় কমিউনিটিতে যোগ দিন</p>
      </div>

      {refParam && (
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            আপনি বন্ধুর রেফারেল লিংক দিয়ে জয়েন করছেন! সাইন-আপের পর ১টি বই পোস্ট করুন।
          </span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">পূর্ণ নাম *</label>
          <input
            type="text"
            placeholder="যেমন: আরিফুল ইসলাম"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-hidden focus:border-emerald-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">ইমেইল *</label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-hidden focus:border-emerald-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">পাসওয়ার্ড *</label>
          <input
            type="password"
            placeholder="কমপক্ষে ৬ ডিজিট"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-hidden focus:border-emerald-500"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নম্বর</label>
          <input
            type="tel"
            placeholder="017XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-hidden focus:border-emerald-500"
          />
        </div>

        {/* DYNAMIC GPS & LOCATION SECTION */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              আপনার এলাকা / জেলা *
            </label>
            <button
              type="button"
              onClick={handleFetchGps}
              disabled={detectingGps}
              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
            >
              {detectingGps ? (
                <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Crosshair className="w-2.5 h-2.5" />
              )}
              <span>লাইভ GPS</span>
            </button>
          </div>

          <input
            type="text"
            placeholder="যেমন: বগুড়া সদর / মিরপুর ১০"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-hidden focus:border-emerald-500"
            required
          />

          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="যেকোনো জেলা/থানা লিখে সার্চ করুন..."
              value={locationSearchQuery}
              onChange={(e) => handleLocationSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 text-[11px] bg-white outline-hidden"
            />
          </div>

          {locationSuggestions.length > 0 && (
            <div className="space-y-1 bg-white border border-slate-200 rounded-xl p-1.5 max-h-32 overflow-y-auto">
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
                  className="w-full text-left p-1 rounded-md hover:bg-emerald-50 text-[11px] text-slate-800 flex items-center gap-1 truncate"
                >
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all mt-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <span>রেজিস্ট্রেশন সম্পন্ন করুন</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
          <Link href="/login" className="font-bold text-emerald-700 hover:underline">
            লগইন করুন
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs">লোড হচ্ছে...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
