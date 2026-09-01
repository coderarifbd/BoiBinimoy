"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { BookOpen, LogIn, Sparkles, ShieldCheck, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "লগইন ব্যর্থ হয়েছে");

      login(data.user);
      router.push(redirect);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 transition-colors">
      {/* Brand */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-500/20">
          <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">লগইন করুন</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">BoiBinimoy অ্যাকাউন্টে প্রবেশ করুন</p>
      </div>

      {/* Quick Demo Fill Buttons for Testing */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5 text-xs">
        <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
          ⚡ ১-ক্লিক ডেমো লগইন:
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fillCredentials("admin@boibinimoy.com", "admin123456")}
            className="flex-1 py-1.5 px-2 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-300 font-bold rounded-xl border border-rose-200 dark:border-rose-900/60 text-[10px] transition-colors cursor-pointer"
          >
            👑 সুপার অ্যাডমিন
          </button>
          <button
            type="button"
            onClick={() => fillCredentials("tanvir@gmail.com", "123456")}
            className="flex-1 py-1.5 px-2 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold rounded-xl border border-emerald-200 dark:border-emerald-900/60 text-[10px] transition-colors cursor-pointer"
          >
            🎓 ইউজার (তানভীর - ঢাবি)
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            ইমেইল *
          </label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm outline-hidden focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            পাসওয়ার্ড *
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm outline-hidden focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          {loading ? "লগইন হচ্ছে..." : "লগইন"}
          <LogIn className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
        অ্যাকাউন্ট নেই?{" "}
        <Link href="/register" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
          নতুন অ্যাকাউন্ট খুলুন (সাইন-আপ)
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-xs text-slate-400">লোডিং...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
