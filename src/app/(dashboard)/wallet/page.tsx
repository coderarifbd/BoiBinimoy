"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Gift,
  Share2,
  Copy,
  Check,
  TrendingUp,
  DollarSign,
  Smartphone,
  ShieldCheck,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface ReferralLogItem {
  id: string;
  hasListedBook: boolean;
  pointsAwarded: number;
  createdAt: string;
  referredUser: {
    name: string;
    createdAt: string;
    _count: { books: number };
  };
}

interface WithdrawalItem {
  id: string;
  amount: number;
  method: string;
  accountNumber: string;
  status: string;
  adminNote?: string;
  createdAt: string;
}

export default function WalletPage() {
  const { user, refreshUser } = useAuth();

  const [points, setPoints] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [totalReferred, setTotalReferred] = useState(0);
  const [verifiedReferrals, setVerifiedReferrals] = useState(0);
  const [referralLogs, setReferralLogs] = useState<ReferralLogItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Cashout Modal State
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [method, setMethod] = useState("BKASH");
  const [accountNumber, setAccountNumber] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  const [copied, setCopied] = useState(false);

  const fetchWalletData = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/wallet/withdraw");
      const data = await res.json();
      if (res.ok) {
        setPoints(data.points || 0);
        setReferralCode(data.referralCode || user.referralCode);
        setTotalReferred(data.totalReferred || 0);
        setVerifiedReferrals(data.verifiedReferrals || 0);
        setReferralLogs(data.referralLogs || []);
        setWithdrawals(data.withdrawals || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = `${origin}/register?ref=${referralCode || user?.referralCode || "BOI100"}`;

  const handleCopyLink = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(referralLink);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = referralLink;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn("Copy error:", e);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `বন্ধু, বইবিনিময়ে যোগ দাও এবং তোমার পুরনো বই ফ্রি/সোয়াপ/বিক্রি করো! এই লিংকে সাইন-আপ করে অন্তত ১টি বই পোস্ট করো: ${referralLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleShareMessenger = () => {
    const text = encodeURIComponent(referralLink);
    window.open(`fb-messenger://share/?link=${text}`, "_blank");
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber) return;

    setWithdrawing(true);
    setWithdrawError("");

    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, accountNumber }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "উইথড্র রিকোয়েস্ট ব্যর্থ হয়েছে");

      setWithdrawSuccess(true);
      fetchWalletData();
      refreshUser();
    } catch (err: any) {
      setWithdrawError(err.message);
    } finally {
      setWithdrawing(false);
    }
  };

  if (!user && !loading) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <Gift className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">ওয়ালেট দেখতে লগইন করুন</h2>
        <Link
          href="/login"
          className="inline-block mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
        >
          লগইন করুন
        </Link>
      </div>
    );
  }

  // Progress calculations (Goal: 10 verified friends = 1000 points = ৳50)
  const currentProgressCount = verifiedReferrals % 10;
  const neededFriends = 10 - currentProgressCount;
  const progressPercent = Math.min((currentProgressCount / 10) * 100, 100);
  const canWithdraw = points >= 1000;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 transition-colors">
      {/* 1. HERO BANNER: 10 FRIENDS = ৳50 */}
      <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold text-amber-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>গ্রোথ ও রেফারেল সিস্টেম</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black">
                ১০ জন বন্ধুতে ৫০ টাকা রিওয়ার্ড! ৳
              </h1>
              <p className="text-sm text-amber-100 mt-1 max-w-xl">
                আপনার রেফারেল লিংকে জয়েন করে প্রতিটি বন্ধু ১টি বই আপলোড করলে পাবেন ১০০ পয়েন্ট। ১০ জন পূর্ণ হলেই ১,০০০ পয়েন্ট (৫০ টাকা) বিকাশ, নগদ বা মোবাইল রিচার্জে ক্যাশআউট করুন!
              </p>
            </div>

            {/* Current Balance Box */}
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 text-center shrink-0 min-w-[180px]">
              <span className="text-xs font-semibold text-amber-200 uppercase tracking-wider block">
                আপনার ব্যালেন্স
              </span>
              <span className="text-3xl sm:text-4xl font-black text-white block my-0.5">
                {points}
              </span>
              <span className="text-xs font-bold text-amber-100">
                পয়েন্ট ({Math.floor(points / 20)} টাকা সমমূল্য)
              </span>
            </div>
          </div>

          {/* 2. LIVE PROGRESS BAR */}
          <div className="bg-black/20 rounded-2xl p-4 sm:p-5 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
              <span>
                🎯 লাইভ প্রগ্রেস: {currentProgressCount}/১০ জন বন্ধু বই লিস্ট করেছে
              </span>
              <span className="text-amber-300">
                {neededFriends === 10 ? "শুরু করুন" : `আর ${neededFriends} জন হলেই ৫০ টাকা!`}
              </span>
            </div>

            {/* Bar */}
            <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-amber-200">
              <span>০ ফ্রেন্ড (০ pt)</span>
              <span>৫ ফ্রেন্ড (৫০০ pt)</span>
              <span>১০ ফ্রেন্ড (১,০০০ pt = ৳৫০)</span>
            </div>
          </div>

          {/* WITHDRAW BUTTON (Active when points >= 1000) */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setWithdrawSuccess(false);
                setWithdrawModalOpen(true);
              }}
              disabled={!canWithdraw}
              className={`w-full sm:w-auto py-3.5 px-8 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                canWithdraw
                  ? "bg-white text-slate-900 hover:bg-amber-50 shadow-white/20 scale-105"
                  : "bg-white/20 text-white/60 cursor-not-allowed"
              }`}
            >
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Withdraw ৳50 (ক্যাশআউট)</span>
            </button>

            {!canWithdraw && (
              <span className="text-xs text-amber-200 font-medium">
                🔒 ক্যাশআউট করতে কমপক্ষে ১,০০০ পয়েন্ট প্রয়োজন (বাকি: {1000 - points} pt)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. SHARE REFERRAL LINK WIDGET */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Share2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>আপনার নিজস্ব রেফারেল লিংক</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          লিংকটি কপি করে বন্ধুদের পাঠান। তারা সাইন-আপ করার পর অন্তত ১টি আসল বই লিস্ট করলেই আপনার একাউন্টে ১০০ পয়েন্ট জমা হবে।
        </p>

        {/* Link Input Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-hidden"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400 dark:text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "কপি হয়েছে!" : "লিংক কপি"}</span>
          </button>
        </div>

        {/* Social Share Buttons */}
        <div className="flex flex-wrap gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <span>💬 হোয়াটসঅ্যাপে শেয়ার করুন</span>
          </button>

          <button
            type="button"
            onClick={handleShareMessenger}
            className="px-4 py-2 bg-[#0084FF] hover:bg-[#0073e6] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <span>⚡ মেসেঞ্জারে শেয়ার করুন</span>
          </button>
        </div>

        {/* Anti-Fraud Notice */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5 mt-4">
          <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>ফ্রড প্রিভেনশন রুল:</strong> শুধু ফেক সাইন-আপ ঠেকাতে নতুন বন্ধুকে অবশ্যই অন্তত ১টি বইয়ের ছবি দিয়ে লিস্টিং সম্পন্ন করতে হবে। বই লিস্ট করলেই পয়েন্ট যোগ হবে।
          </p>
        </div>
      </div>

      {/* 4. REFERRED FRIENDS & VERIFICATION STATUS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>রেফার করা বন্ধুদের হিস্ট্রি</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              মোট জয়েন করেছে {totalReferred} জন (সফল বই লিস্টিং: {verifiedReferrals} জন)
            </p>
          </div>
        </div>

        {referralLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
            এখনও কোনো বন্ধু আপনার লিংকে জয়েন করেনি। বন্ধুদের রেফারেল লিংক শেয়ার করুন!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto pr-1">
            {referralLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{log.referredUser.name}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    জয়েন তারিখ: {new Date(log.createdAt).toLocaleDateString("bn-BD")}
                  </p>
                </div>

                <div>
                  {log.hasListedBook ? (
                    <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold rounded-lg text-[11px] flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/60">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>বই লিস্ট করেছে (+১০০ pt)</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold rounded-lg text-[11px] border border-amber-200 dark:border-amber-800/60">
                      ⏳ বই লিস্টিং বাকি (০ pt)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. WITHDRAWAL HISTORY */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>ক্যাশআউট ও উইথড্র হিস্ট্রি</span>
        </h2>

        {withdrawals.length === 0 ? (
          <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
            আপনার কোনো উইথড্র রিকোয়েস্ট নেই
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {withdrawals.map((w) => (
              <div key={w.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                    <span>৳{w.amount}</span>
                    <span className="text-slate-400">•</span>
                    <span>{w.method}: {w.accountNumber}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    তারিখ: {new Date(w.createdAt).toLocaleDateString("bn-BD")}
                  </p>
                  {w.adminNote && (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                      নোট: {w.adminNote}
                    </p>
                  )}
                </div>

                <div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      w.status === "APPROVED"
                        ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                        : w.status === "REJECTED"
                        ? "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60"
                        : "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                    }`}
                  >
                    {w.status === "APPROVED"
                      ? "Paid / Approved"
                      : w.status === "REJECTED"
                      ? "Rejected"
                      : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WITHDRAW MODAL */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>৫০ টাকা উইথড্র রিকোয়েস্ট</span>
              </h3>
              <button
                type="button"
                onClick={() => setWithdrawModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {withdrawSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white">উইথড্র রিকোয়েস্ট সফলভাবে সাবমিট হয়েছে!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  সুপার অ্যাডমিন আপনার রেফারেল ভেরিফাই করে অল্প সময়ের মধ্যে টাকা পাঠিয়ে দেবেন।
                </p>
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  ঠিক আছে
                </button>
              </div>
            ) : (
              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ১,০০০ পয়েন্টের বিনিময়ে ৫০ টাকা ক্যাশআউট রিকোয়েস্ট সাবমিট করুন।
                </p>

                {withdrawError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-xl text-xs">
                    {withdrawError}
                  </div>
                )}

                {/* Method selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    ক্যাশআউট মেথড নির্বাচন করুন *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["BKASH", "NAGAD", "RECHARGE"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                          method === m
                            ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {m === "BKASH" ? "বিকাশ (bKash)" : m === "NAGAD" ? "নগদ (Nagad)" : "মোবাইল রিচার্জ"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account / Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {method === "RECHARGE" ? "রিচার্জ মোবাইল নম্বর *" : `${method} একাউন্ট নম্বর *`}
                  </label>
                  <input
                    type="tel"
                    placeholder="যেমন: 017XXXXXXXX"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={withdrawing}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    {withdrawing ? "প্রসেস হচ্ছে..." : "উইথড্র রিকোয়েস্ট সাবমিট করুন (৫০৳)"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
