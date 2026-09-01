"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ShieldCheck, Heart, MapPin, Sparkles } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on 1-on-1 chat page so it behaves like native Facebook Messenger / WhatsApp Web
  if (pathname.startsWith("/chat/")) {
    return null;
  }

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-white tracking-tight leading-none">
                  BoiBinimoy
                </span>
                <span className="text-[11px] font-bold text-emerald-400 tracking-wider mt-0.5 leading-none">
                  বইবিনিময়
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              বাংলাদেশের প্রথম হাইপার-লোকাল বই শেয়ারিং, সেল ও সোয়াপিং প্ল্যাটফর্ম। নিজের আশেপাশের শিক্ষার্থীদের সাথে সহজে বই বিনিময় করুন।
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>১০০% নিরাপদ ও ভেরিফাইড কমিউনিটি</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              এক্সপ্লোর করুন
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/explore" className="hover:text-emerald-400 transition-colors">
                  ম্যাপ ও লোকাল বই ব্রাউজ
                </Link>
              </li>
              <li>
                <Link href="/requests" className="hover:text-emerald-400 transition-colors">
                  বইয়ের খোঁজ চাই (Requests)
                </Link>
              </li>
              <li>
                <Link href="/list-book" className="hover:text-emerald-400 transition-colors">
                  ৩-স্টেপে বই পোস্ট করুন
                </Link>
              </li>
              <li>
                <Link href="/wallet" className="hover:text-emerald-400 transition-colors">
                  ১০ বন্ধু রেফার করলেই ৫০৳
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Hubs */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              জনপ্রিয় এলাকা ও ক্যাম্পাস
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                ঢাকা বিশ্ববিদ্যালয় ও নীলক্ষেত
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                বুয়েট ও ঢাকা মেডিকেল
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                মিরপুর ১০ ও ধানমন্ডি ২৭
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                চট্টগ্রাম ও রাজশাহী বিশ্ববিদ্যালয়
              </li>
            </ul>
          </div>

          {/* Safe Community */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              নিরাপদ লেনদেন
            </h4>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              পাবলিক স্পট যেমন মেট্রো স্টেশন বা লাইব্রেরি গেটে বই হাতবদল করুন। ব্যক্তিগত ফোন নম্বর না দিয়ে ইন-অ্যাপ মেসেঞ্জারে কথা বলুন।
            </p>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                রেফারেল রিওয়ার্ড
              </div>
              <p className="text-[11px] text-slate-300">
                বন্ধুদের ইনভাইট করুন, প্রত্যেকে ১টি বই লিস্ট করলে পান ১০০ পয়েন্ট!
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} BoiBinimoy (বইবিনিময়). সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Bangladeshi Readers
          </p>
        </div>
      </div>
    </footer>
  );
}
