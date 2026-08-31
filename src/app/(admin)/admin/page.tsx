"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  ShieldAlert,
  Users,
  BookOpen,
  DollarSign,
  Gift,
  CheckCircle,
  XCircle,
  Trash2,
  Ban,
  MapPin,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface AnalyticsData {
  totalUsers: number;
  totalBooks: number;
  availableBooks: number;
  totalReferrals: number;
  pendingPayouts: number;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    locationName?: string;
    points: number;
    createdAt: string;
  }>;
  topAreas: Array<{ name: string; count: number }>;
}

interface PayoutItem {
  id: string;
  userId: string;
  amount: number;
  pointsDeducted: number;
  method: string;
  accountNumber: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    points: number;
    locationName?: string;
    referralLogs: Array<{
      id: string;
      hasListedBook: boolean;
      referredUser: {
        id: string;
        name: string;
        email: string;
        _count: { books: number };
      };
    }>;
  };
}

interface ModerationBook {
  id: string;
  title: string;
  author: string;
  category: string;
  condition: string;
  dealType: string;
  price: number;
  status: string;
  approxLocation?: string;
  images: string[];
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    isBanned: boolean;
  };
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  points: number;
  referralCode: string;
  isBanned: boolean;
  locationName?: string;
  createdAt: string;
  _count: {
    books: number;
    referralsMade: number;
    withdrawals: number;
  };
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"analytics" | "payouts" | "moderation" | "users">("analytics");

  // State
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [books, setBooks] = useState<ModerationBook[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Payout action state
  const [processingPayout, setProcessingPayout] = useState<string | null>(null);
  const [trxNote, setTrxNote] = useState<Record<string, string>>({});

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, payoutsRes, modRes, usersRes] = await Promise.all([
        fetch("/api/admin/analytics"),
        fetch("/api/admin/payouts"),
        fetch("/api/admin/moderation"),
        fetch("/api/admin/users"),
      ]);

      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (payoutsRes.ok) {
        const pData = await payoutsRes.json();
        setPayouts(pData.payouts || []);
      }
      if (modRes.ok) {
        const mData = await modRes.json();
        setBooks(mData.books || []);
      }
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.isSuperAdmin) {
      fetchAdminData();
    }
  }, [user]);

  // Handle Payout Status change (APPROVED / REJECTED)
  const handlePayoutAction = async (payoutId: string, status: "APPROVED" | "REJECTED") => {
    setProcessingPayout(payoutId);
    try {
      const note = trxNote[payoutId] || (status === "APPROVED" ? "টাকা সফলভাবে পাঠানো হয়েছে" : "জালিয়াতির কারণে বাতিল");
      const res = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, status, adminNote: note }),
      });

      if (res.ok) {
        setPayouts((prev) =>
          prev.map((p) => (p.id === payoutId ? { ...p, status, adminNote: note } : p))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingPayout(null);
    }
  };

  // Handle Book Deletion (Content Moderation)
  const handleDeleteBook = async (bookId: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই বইয়ের লিস্টিংটি ডিলিট করতে চান?")) return;
    try {
      const res = await fetch(`/api/admin/moderation?bookId=${bookId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBooks((prev) => prev.filter((b) => b.id !== bookId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle User Ban / Unban
  const handleToggleBan = async (targetUserId: string, currentBanStatus: boolean) => {
    const actionName = currentBanStatus ? "আনব্যান" : "ব্যান";
    if (!confirm(`আপনি কি এই ব্যবহারকারীকে ${actionName} করতে চান?`)) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, isBanned: !currentBanStatus }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUserId ? { ...u, isBanned: !currentBanStatus } : u))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs">অনুমোদন যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  if (!user || !user.isSuperAdmin) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
        <h1 className="text-xl font-black text-slate-900">অননুমোদিত অ্যাক্সেস</h1>
        <p className="text-xs text-slate-500">
          শুধুমাত্র নির্ধারিত সুপার অ্যাডমিন ইমেইল (<code className="bg-slate-100 p-1 rounded font-bold text-rose-700">admin@boibinimoy.com</code>) দিয়ে এই প্যানেলে প্রবেশ করা যাবে।
        </p>
        <Link
          href="/login"
          className="inline-block px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
        >
          অ্যাডমিন হিসেবে লগইন করুন
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header with Admin Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            সুপার অ্যাডমিন ড্যাশবোর্ড (Super Admin Panel)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            BoiBinimoy কন্ট্রোল প্যানেল
          </h1>
          <p className="text-xs text-slate-400">
            লগইনকৃত অ্যাডমিন: <span className="text-emerald-400 font-bold">{user.email}</span>
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          রিফ্রেশ ডাটা
        </button>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: "analytics", label: "📊 প্ল্যাটফর্ম অ্যানালিটিক্স", count: null },
          { id: "payouts", label: "💸 ক্যাশআউট ও পেআউট ম্যানেজার", count: payouts.filter((p) => p.status === "PENDING").length },
          { id: "moderation", label: "🛡️ লিস্টিং ও কনটেন্ট মডারেশন", count: books.length },
          { id: "users", label: "👥 ইউজার অ্যাকশন ও ব্যান সিস্টেম", count: users.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
              activeTab === tab.id
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && tab.count > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  tab.id === "payouts"
                    ? "bg-rose-500 text-white animate-pulse"
                    : "bg-slate-200 text-slate-800"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ================= TAB 1: ANALYTICS OVERVIEW ================= */}
      {activeTab === "analytics" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">মোট সক্রিয় ইউজার</span>
                <span className="text-2xl font-black text-slate-900">{analytics?.totalUsers || 0}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">লাইভ বই লিস্টিং</span>
                <span className="text-2xl font-black text-slate-900">{analytics?.availableBooks || 0}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">সফল রেফারেল (১ম বই লিস্টেড)</span>
                <span className="text-2xl font-black text-slate-900">{analytics?.totalReferrals || 0}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">পেন্ডিং ক্যাশআউট</span>
                <span className="text-2xl font-black text-rose-600">{analytics?.pendingPayouts || 0}</span>
              </div>
            </div>
          </div>

          {/* Area Distribution Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                এলাকাভিত্তিক বই লেনদেন ও হাব পরিসংখ্যান (DU, BUET, Mirpur ইত্যাদি)
              </h3>

              <div className="space-y-3 pt-2">
                {analytics?.topAreas && analytics.topAreas.length > 0 ? (
                  analytics.topAreas.map((area, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>{area.name}</span>
                        <span className="text-emerald-700">{area.count} টি বই</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{
                            width: `${Math.min((area.count / (analytics.totalBooks || 1)) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">কোনো এরিয়া ডাটা নেই</p>
                )}
              </div>
            </div>

            {/* Recent Registered Users */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                সাম্প্রতিক নিবন্ধিত ইউজার
              </h3>

              <div className="divide-y divide-slate-100 text-xs">
                {analytics?.recentUsers?.map((u) => (
                  <div key={u.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{u.name}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold rounded">
                        {u.points} pts
                      </span>
                      <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                        📍 {u.locationName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: PAYOUT MANAGER ================= */}
      {activeTab === "payouts" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              ক্যাশআউট ও পেআউট ম্যানেজার (৫০ টাকা বিকাশ / নগদ / রিচার্জ)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              ব্যবহারকারীদের রেফারেল হিস্ট্রি যাচাই করে ম্যানুয়ালি টাকা পাঠিয়ে স্ট্যাটাস Paid বা Rejected করুন।
            </p>
          </div>

          {payouts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              কোনো ক্যাশআউট রিকোয়েস্ট নেই
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((p) => {
                const verifiedFriendsCount = p.user.referralLogs.filter((r) => r.hasListedBook).length;
                const totalJoined = p.user.referralLogs.length;

                return (
                  <div
                    key={p.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      p.status === "PENDING"
                        ? "border-amber-300 bg-amber-50/40"
                        : p.status === "APPROVED"
                        ? "border-emerald-200 bg-emerald-50/20"
                        : "border-rose-200 bg-rose-50/20 opacity-70"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* User & Request Info */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-900">
                            ৳{p.amount} টাকা উইথড্র
                          </span>
                          <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded">
                            {p.method}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : p.status === "REJECTED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800 animate-pulse"
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 font-medium">
                          ইউজার: <strong>{p.user.name}</strong> ({p.user.email}) | ফোন: {p.user.phone || "N/A"}
                        </p>
                        <p className="text-xs text-emerald-800 font-mono font-bold">
                          পেমেন্ট নম্বর: {p.accountNumber} ({p.method})
                        </p>
                        <p className="text-[11px] text-slate-400">
                          রিকোয়েস্ট তারিখ: {new Date(p.createdAt).toLocaleString("bn-BD")}
                        </p>
                      </div>

                      {/* Referral Audit Badge (Anti-Fraud Check) */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1 min-w-[240px]">
                        <span className="font-bold text-slate-800 block">
                          🔍 রেফারেল হিস্ট্রি অডিট:
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">মোট জয়েন করেছে:</span>
                          <span className="font-bold">{totalJoined} জন</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">আসল বই লিস্ট করেছে:</span>
                          <span
                            className={`font-black ${
                              verifiedFriendsCount >= 10 ? "text-emerald-600" : "text-amber-600"
                            }`}
                          >
                            {verifiedFriendsCount}/১০ জন
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for Pending */}
                    {p.status === "PENDING" && (
                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row items-center gap-3">
                        <input
                          type="text"
                          placeholder="TrxID বা অ্যাডমিন নোট (যেমন: TrxID: 9AK7219L)"
                          value={trxNote[p.id] || ""}
                          onChange={(e) => setTrxNote({ ...trxNote, [p.id]: e.target.value })}
                          className="w-full sm:w-72 px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white outline-hidden"
                        />

                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handlePayoutAction(p.id, "APPROVED")}
                            disabled={processingPayout === p.id}
                            className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            টাকা পাঠানো হয়েছে (Paid / Approved)
                          </button>

                          <button
                            onClick={() => handlePayoutAction(p.id, "REJECTED")}
                            disabled={processingPayout === p.id}
                            className="flex-1 sm:flex-initial px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            জালিয়াতি / Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {p.adminNote && (
                      <div className="mt-2 text-[11px] text-slate-500 bg-white/80 p-2 rounded-lg border border-slate-100">
                        <strong>নোট:</strong> {p.adminNote}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: CONTENT MODERATION ================= */}
      {activeTab === "moderation" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              লিস্টিং ও কনটেন্ট মডারেশন
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              প্ল্যাটফর্মে আপলোড হওয়া সব বইয়ের লাইভ তালিকা দেখুন। পাইরেটেড বা অনুপযুক্ত বই এক ক্লিকে ডিলিট করুন।
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {books.map((b) => (
              <div key={b.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={b.images?.[0] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"}
                    alt={b.title}
                    className="w-14 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                      {b.title}
                    </h4>
                    <p className="text-xs text-slate-500">লেখক: {b.author} | কন্ডিশন: {b.condition}</p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      আপলোডার: {b.user.name} ({b.user.email})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold text-slate-700">
                    {b.dealType === "SELL" ? `৳${b.price}` : b.dealType}
                  </span>
                  <button
                    onClick={() => handleDeleteBook(b.id)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1 border border-rose-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    লিস্টিং ডিলিট
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: USER BAN & AUDIT ================= */}
      {activeTab === "users" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              ইউজার অ্যাকশন ও ব্যান সিস্টেম
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              স্প্যামার বা ভুয়া অ্যাকাউন্ট ট্র্যাক করা এবং সাময়িক বা স্থায়ীভাবে ব্যান / ব্লক করুন।
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">ইউজারের নাম ও ইমেইল</th>
                  <th className="p-3">এলাকা</th>
                  <th className="p-3">পয়েন্ট</th>
                  <th className="p-3">লিস্টেড বই</th>
                  <th className="p-3">রেফারেল</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-semibold text-slate-900">
                      <div>{u.name}</div>
                      <div className="text-slate-400 text-[11px]">{u.email}</div>
                    </td>
                    <td className="p-3 text-slate-600">{u.locationName || "ঢাকা"}</td>
                    <td className="p-3 font-bold text-amber-700">{u.points} pt</td>
                    <td className="p-3 font-bold">{u._count.books}</td>
                    <td className="p-3 font-bold">{u._count.referralsMade}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.isBanned
                            ? "bg-rose-100 text-rose-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {u.isBanned ? "Banned" : "Active"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {u.role !== "SUPER_ADMIN" && (
                        <button
                          onClick={() => handleToggleBan(u.id, u.isBanned)}
                          className={`px-3 py-1 text-xs font-bold rounded-xl transition-colors ${
                            u.isBanned
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                          }`}
                        >
                          {u.isBanned ? "আনব্যান করুন" : "ব্যান করুন"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
