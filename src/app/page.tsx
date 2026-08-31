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
    <div className="space-y-16 pb-20 bg-slate-50">
      {/* 1. CLEAN MODERN HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/80 via-white to-slate-50 pt-12 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>বাংলাদেশের প্রথম হাইপার-লোকাল বই শেয়ারিং প্ল্যাটফর্ম</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.2]">
            আপনার আশেপাশের পাঠকদের সাথে{" "}
            <span className="text-emerald-700 bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
              বই বিনিময়, বিক্রয় ও সোয়াপ
            </span>{" "}
            করুন
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            কোনো মধ্যস্বত্বভোগী বা কমিশন ছাড়া সরাসরি ক্যাম্পাস ও এলাকার শিক্ষার্থীদের সাথে ইন-অ্যাপ মেসেঞ্জারে কথা বলে বই হাতবদল করুন।
          </p>

          {/* Search Box & Quick Action */}
          <div className="max-w-2xl mx-auto pt-2">
            <form
              action="/explore"
              method="GET"
              className="bg-white p-2 rounded-2xl sm:rounded-3xl border border-slate-300 shadow-lg shadow-slate-200/60 flex flex-col sm:flex-row items-center gap-2"
            >
              <div className="flex items-center gap-2 flex-1 w-full px-3 py-1.5 sm:py-0">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  name="query"
                  placeholder="বইয়ের নাম, লেখক বা বিষয় দিয়ে খুঁজুন..."
                  className="w-full text-xs sm:text-sm outline-hidden text-slate-900 placeholder:text-slate-400 bg-transparent"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Search className="w-4 h-4" />
                  <span>খুঁজুন</span>
                </button>

                <Link
                  href="/explore"
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 shrink-0"
                >
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>ম্যাপ</span>
                </Link>
              </div>
            </form>
          </div>

          {/* Popular Categories Pill Bar */}
          <div className="flex items-center justify-center gap-2 flex-wrap pt-2 text-xs">
            <span className="text-slate-500 font-medium">জনপ্রিয়:</span>
            {[
              { label: "ইঞ্জিনিয়ারিং", query: "ACADEMIC_ENG", icon: GraduationCap },
              { label: "মেডিকেল", query: "ACADEMIC_MED", icon: Stethoscope },
              { label: "বিসিএস ও চাকরি", query: "BCS_JOB", icon: Briefcase },
              { label: "উপন্যাস ও সাহিত্য", query: "FICTION", icon: BookMarked },
            ].map((cat, idx) => (
              <Link
                key={idx}
                href={`/explore?category=${cat.query}`}
                className="px-3 py-1 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 rounded-full border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <cat.icon className="w-3.5 h-3.5 text-emerald-600" />
                <span>{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 2. 3 CLEAN VALUE PILLARS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              হাইপার-লোকাল ম্যাপ ডিসকভারি
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              আপনার এলাকার ১-১০ কিমির মধ্যে কে কোন বইটি বিক্রি বা সোয়াপ করছেন সরাসরি ম্যাপে পিন আকারে দেখে নিন।
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              মেসেঞ্জার চ্যাট ও দরদাম
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              ব্যক্তিগত নম্বর শেয়ার ছাড়া ইন-অ্যাপ চ্যাট করুন, দামের প্রস্তাব (Make an Offer) পাঠান এবং নিরাপদ পাবলিক স্পটে হাতবদল করুন।
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Gift className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              ১০ বন্ধুতে ৫০৳ রিওয়ার্ড
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              বন্ধুদের ইনভাইট করুন। প্রত্যেকে ১টি বই পোস্ট করলেই আপনি পাবেন ১০০ পয়েন্ট। ১০০০ পয়েন্ট হলে বিকাশ/নগদে ক্যাশআউট!
            </p>
          </div>
        </div>
      </section>

      {/* 3. RECENT BOOKS FEED */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>সম্প্রতি আপলোড হওয়া বই</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              শিক্ষার্থীদের সংগৃহীত বইসমূহ থেকে বেছে নিন
            </p>
          </div>

          <Link
            href="/explore"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
          >
            <span>সব দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {recentBooks.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col group"
            >
              <div className="relative h-44 sm:h-52 bg-slate-100 overflow-hidden">
                <img
                  src={book.images?.[0] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 bg-slate-200"
                />

                {/* Deal Type Badge */}
                <div className="absolute top-2.5 left-2.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold shadow-xs ${
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

                <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                  {book.condition}
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 mb-1 group-hover:text-emerald-700 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">{book.author}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 truncate max-w-[100px]">
                    📍 {book.approxLocation || "ক্যাম্পাস"}
                  </span>
                  <span className="font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    চ্যাট →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. BOOK REQUESTS ("বইয়ের খোঁজ চাই") SNIPPET */}
      {recentRequests.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-emerald-50/70 rounded-3xl p-6 sm:p-8 border border-emerald-200/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  বইয়ের খোঁজ চাই
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
                  পাঠকদের কাঙ্ক্ষিত বইয়ের তালিকা
                </h2>
              </div>
              <Link
                href="/requests"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl self-start sm:self-auto shadow-xs transition-colors"
              >
                সব রিকোয়েস্ট দেখুন
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2.5"
                >
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">
                    {req.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 italic">
                    "{req.description || "আমার এই বইটি জরুরি প্রয়োজন"}"
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>👤 {req.user?.name}</span>
                    <span className="text-emerald-700 font-semibold">📍 {req.approxLocation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. CALL TO ACTION: POST A BOOK */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-black">
              আপনার কাছে অপ্রয়োজনীয় বই জমা আছে?
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-lg">
              সহজ ৩ ধাপে মাত্র ১ মিনিটে বইটি লিস্ট করুন এবং আশেপাশের অন্য কোনো শিক্ষার্থীর উপকারে আসুন।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/list-book"
              className="px-6 py-3.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all hover:scale-105"
            >
              বই পোস্ট করুন →
            </Link>
            <Link
              href="/wallet"
              className="px-5 py-3.5 bg-emerald-800/60 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs sm:text-sm border border-emerald-500/40 transition-colors"
            >
              রেফারেল রিওয়ার্ড
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
