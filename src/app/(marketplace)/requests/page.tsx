"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { POPULAR_LOCATIONS } from "@/lib/geo";
import { useRouter } from "next/navigation";
import {
  Search,
  PlusCircle,
  MessageCircle,
  BookOpen,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface BookRequestItem {
  id: string;
  title: string;
  author?: string;
  category: string;
  description?: string;
  approxLocation?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    locationName?: string;
    image?: string;
  };
}

export default function BookRequestsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<BookRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [reqCategory, setReqCategory] = useState("ACADEMIC_ENG");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState(user?.locationName || "ঢাকা বিশ্ববিদ্যালয় (DU)");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "ALL") params.append("category", category);
      if (searchQuery) params.append("query", searchQuery);

      const res = await fetch(`/api/requests?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [category]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login?redirect=/requests");
      return;
    }

    setPosting(true);
    setError("");

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          category: reqCategory,
          description,
          approxLocation: locationName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "রিকোয়েস্ট পোস্ট করা যায়নি");

      setModalOpen(false);
      setTitle("");
      setAuthor("");
      setDescription("");
      fetchRequests();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleStartChatWithRequester = async (reqItem: BookRequestItem) => {
    if (!user) {
      router.push("/login?redirect=/requests");
      return;
    }
    if (reqItem.user.id === user.id) {
      alert("এটি আপনার নিজের পোস্ট করা রিকোয়েস্ট!");
      return;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: reqItem.user.id }),
      });
      const data = await res.json();
      if (res.ok && data.roomId) {
        // Send initial auto-message about this request
        await fetch(`/api/chat/${data.roomId}/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `হ্যালো! আপনার রিকোয়েস্ট করা '${reqItem.title}' বইটি আমার কাছে আছে। বিস্তারিত কথা বলতে পারেন।`,
          }),
        });
        router.push(`/chat/${data.roomId}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/30 text-xs font-bold text-emerald-200">
            <HelpCircle className="w-3.5 h-3.5" />
            বইয়ের খোঁজ চাই (Book Request Wall)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            কাঙ্ক্ষিত বইটি প্ল্যাটফর্মে পাচ্ছেন না?
          </h1>
          <p className="text-sm text-emerald-100 max-w-xl leading-relaxed">
            এখানে আপনার দরকারি বইটির নাম লিখে পোস্ট করুন। আপনার আশেপাশে কারও কাছে বইটি থাকলে সে সরাসরি মেসেঞ্জারে নক দেবে!
          </p>
        </div>

        <button
          onClick={() => {
            if (!user) {
              router.push("/login?redirect=/requests");
              return;
            }
            setModalOpen(true);
          }}
          className="px-6 py-3.5 bg-white text-emerald-900 hover:bg-emerald-50 font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 text-sm"
        >
          <PlusCircle className="w-5 h-5 text-emerald-600" />
          রিকোয়েস্ট পোস্ট করুন
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="রিকোয়েস্ট খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchRequests()}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "সকল রিকোয়েস্ট" },
            { id: "ACADEMIC_ENG", label: "ইঞ্জিনিয়ারিং" },
            { id: "ACADEMIC_MED", label: "মেডিকেল" },
            { id: "BCS_JOB", label: "বিসিএস/চাকরি" },
            { id: "FICTION", label: "ফিকশন" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                category === cat.id
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span className="text-xs">রিকোয়েস্ট লোড হচ্ছে...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">কোনো বইয়ের রিকোয়েস্ট পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            আপনি প্রথম রিকোয়েস্টটি পোস্ট করে দেখুন!
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
          >
            রিকোয়েস্ট পোস্ট করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((reqItem) => (
            <div
              key={reqItem.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    🔍 বইয়ের খোঁজ
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(reqItem.createdAt).toLocaleDateString("bn-BD")}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 line-clamp-1 mb-1">
                  {reqItem.title}
                </h3>
                {reqItem.author && (
                  <p className="text-xs text-slate-500 mb-2">লেখক: {reqItem.author}</p>
                )}

                {reqItem.description && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3 leading-relaxed">
                    "{reqItem.description}"
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                    {reqItem.user.name.slice(0, 1)}
                  </div>
                  <span className="font-semibold text-slate-700">{reqItem.user.name}</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-medium">📍 {reqItem.approxLocation}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">আশেপাশে বইটি আছে?</span>
                <button
                  onClick={() => handleStartChatWithRequester(reqItem)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  আমার কাছে আছে (নক দিন)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Creating Book Request */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
                নতুন বইয়ের খোঁজ পোস্ট করুন
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বইয়ের নাম *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: Discrete Mathematics (Rosen)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">লেখক</label>
                <input
                  type="text"
                  placeholder="যেমন: Kenneth Rosen"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ক্যাটাগরি</label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-hidden focus:border-emerald-500"
                  >
                    <option value="ACADEMIC_ENG">ইঞ্জিনিয়ারিং</option>
                    <option value="ACADEMIC_MED">মেডিকেল</option>
                    <option value="ACADEMIC_COLLEGE">স্কুল / কলেজ</option>
                    <option value="BCS_JOB">বিসিএস / চাকরি</option>
                    <option value="FICTION">ফিকশন</option>
                    <option value="NON_FICTION">নন-ফিকশন</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">আপনার এলাকা</label>
                  <select
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-hidden focus:border-emerald-500"
                  >
                    {POPULAR_LOCATIONS.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বিস্তারিত নোট বা কোন এডিশন দরকার
                </label>
                <textarea
                  rows={3}
                  placeholder="যেমন: ৩য় সেমিস্টারের জন্য দরকার, কালকের মধ্যে নীলক্ষেত বা ক্যাম্পাসে মিট করতে পারব।"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-hidden focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={posting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  {posting ? "পোস্ট হচ্ছে..." : "রিকোয়েস্ট পাবলিশ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
