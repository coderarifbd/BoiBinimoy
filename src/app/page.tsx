import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  BookOpen,
  MapPin,
  MessageCircle,
  Gift,
  PlusCircle,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Stethoscope,
  Briefcase,
  BookMarked,
  Layers,
  Repeat,
  Heart,
  TrendingUp,
  CheckCircle2,
  Users,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fetch recent books for the homepage feed
  let recentBooks: any[] = [];
  let recentRequests: any[] = [];
  try {
    recentBooks = await prisma.book.findMany({
      where: { status: "AVAILABLE" },
      take: 8,
      orderBy: { createdAt: "desc" },
    });

    recentRequests = await prisma.bookRequest.findMany({
      where: { status: "OPEN" },
      take: 3,
      include: {
        user: { select: { name: true, locationName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    console.error("Home query error:", e);
  }

  return (
    <div className="min-h-screen space-y-16 pb-20 transition-colors">
      {/* 1. ULTRA-CLEAN EYE-FRIENDLY HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Soft Ambient Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent pointer-events-none rounded-b-[4rem]"></div>

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>বাংলাদেশের প্রথম হাইপার-লোকাল বই শেয়ারিং প্ল্যাটফর্ম</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.2]">
            আপনার ক্যাম্পাসে বই কিনুন,{" "}
            <span className="text-emerald-600 dark:text-emerald-400 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 bg-clip-text text-transparent">
              বিক্রি ও বিনিময় করুন
            </span>
          </h1>

          {/* Subtitle - Increased Font for Comfortable Reading */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            জিরো কমিশন ও কোনো মধ্যস্বত্বভোগী ছাড়া সরাসরি আশেপাশের শিক্ষার্থীদের সাথে ইন-অ্যাপ মেসেঞ্জারে কথা বলে বই হাতবদল করুন।
          </p>

          {/* Minimal Search & Action Bar */}
          <div className="max-w-2xl mx-auto pt-3">
            <form
              action="/explore"
              method="GET"
              className="bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/40 flex flex-col sm:flex-row items-center gap-2 hover:border-emerald-400 dark:hover:border-emerald-500/60 transition-all"
            >
              <div className="flex items-center gap-2.5 flex-1 w-full px-3 py-1 sm:py-0">
                <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
                <input
                  type="text"
                  name="query"
                  placeholder="বইয়ের নাম, লেখক বা বিষয় দিয়ে খুঁজুন..."
                  className="w-full text-sm sm:text-base outline-hidden text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent font-medium"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl sm:rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>খুঁজুন</span>
                </button>

                <Link
                  href="/explore"
                  className="px-4 py-3 bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 rounded-xl sm:rounded-2xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5 shrink-0 border border-emerald-200/60 dark:border-slate-700"
                >
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>ম্যাপ ভিউ</span>
                </Link>
              </div>
            </form>
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center justify-center gap-2 flex-wrap pt-2 text-sm">
            <span className="text-slate-400 dark:text-slate-500 font-medium">ক্যাটাগরি:</span>
            {[
              { label: "ইঞ্জিনিয়ারিং", query: "ACADEMIC_ENG", icon: GraduationCap },
              { label: "মেডিকেল", query: "ACADEMIC_MED", icon: Stethoscope },
              { label: "বিসিএস ও চাকরি", query: "BCS_JOB", icon: Briefcase },
              { label: "উপন্যাস ও সাহিত্য", query: "FICTION", icon: BookMarked },
            ].map((cat, idx) => (
              <Link
                key={idx}
                href={`/explore?category=${cat.query}`}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs"
              >
                <cat.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{cat.label}</span>
              </Link>
            ))}
          </div>

          {/* Trust Points */}
          <div className="pt-4 flex items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium flex-wrap">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>১০০% ফ্রি ও জিরো কমিশন</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>ইন-অ্যাপ মেসেঞ্জার চ্যাট</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>নিরাপদ লোকাল স্পটে হ্যান্ডওভার</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS (৩টি সহজ ধাপ) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              কীভাবে কাজ করে বইবিনিময়?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              মাত্র ৩টি সহজ ধাপে বই আদান-প্রদান সম্পন্ন করুন
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-3 relative group hover:bg-emerald-50/50 dark:hover:bg-slate-800 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-emerald-600/20">
                ১
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                বই খুঁজুন বা পোস্ট করুন
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                আপনার এলাকার ১-১০ কিমির মধ্যে বই সার্চ করুন অথবা নিজের অপ্রয়োজনীয় বই মাত্র ১ মিনিটে পোস্ট করুন।
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-3 relative group hover:bg-emerald-50/50 dark:hover:bg-slate-800 transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-teal-600/20">
                ২
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                মেসেঞ্জারে চ্যাট ও দরদাম
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                ব্যক্তিগত ফোন নম্বর ছাড়াই ইন-অ্যাপ চ্যাটে কথা বলুন, অফার পাঠান এবং দাম চূড়ান্ত করুন।
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-3 relative group hover:bg-emerald-50/50 dark:hover:bg-slate-800 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-amber-600/20">
                ৩
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                কাছের স্পটে নিরাপদ বিনিময়
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                ক্যাম্পাস বা নিকটস্থ পরিচিত পাবলিক স্পটে দেখা করে সরাসরি বই হাতবদল করুন।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. RECENT BOOKS FEED */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>সদ্য আপলোড হওয়া বই</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              শিক্ষার্থীদের সংগৃহীত বইসমূহ থেকে বেছে নিন
            </p>
          </div>

          <Link
            href="/explore"
            className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-emerald-200/80 dark:border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <span>সব দেখুন</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {recentBooks.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-400 dark:hover:border-emerald-500/60 transition-all flex flex-col group"
            >
              <div className="relative h-44 sm:h-52 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img
                  src={book.images?.[0] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 bg-slate-200 dark:bg-slate-800"
                />

                {/* Deal Type Badge */}
                <div className="absolute top-2.5 left-2.5">
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

                <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">
                  {book.condition}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base line-clamp-1 mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">{book.author}</p>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                    📍 {book.approxLocation || "ক্যাম্পাস"}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    চ্যাট →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. BOOK REQUESTS ("বইয়ের খোঁজ চাই") */}
      {recentRequests.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-emerald-50/60 dark:bg-slate-900/80 rounded-3xl p-6 sm:p-8 border border-emerald-200/60 dark:border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-200/60 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  বইয়ের খোঁজ চাই
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  পাঠকদের কাঙ্ক্ষিত বইয়ের তালিকা
                </h2>
              </div>
              <Link
                href="/requests"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl self-start sm:self-auto shadow-xs transition-colors"
              >
                সব রিকোয়েস্ট দেখুন
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 hover:border-emerald-400 dark:hover:border-emerald-500/60 transition-all"
                >
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1">
                    {req.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                    "{req.description || "আমার এই বইটি জরুরি প্রয়োজন"}"
                  </p>
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>👤 {req.user?.name}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">📍 {req.approxLocation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. CALL TO ACTION BANNER */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-500/20">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-black">
              আপনার কাছে অপ্রয়োজনীয় বই জমা আছে?
            </h3>
            <p className="text-sm sm:text-base text-emerald-100/90 max-w-lg">
              সহজ ৩ ধাপে মাত্র ১ মিনিটে বইটি লিস্ট করুন এবং আশেপাশের অন্য কোনো শিক্ষার্থীর উপকারে আসুন।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/list-book"
              className="px-6 py-3.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl font-black text-sm shadow-md transition-all hover:scale-105"
            >
              বই পোস্ট করুন →
            </Link>
            <Link
              href="/wallet"
              className="px-5 py-3.5 bg-emerald-950/60 hover:bg-emerald-900 text-white rounded-2xl font-bold text-sm border border-emerald-500/40 transition-colors"
            >
              রেফারেল রিওয়ার্ড
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
