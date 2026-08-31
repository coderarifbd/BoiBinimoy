"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  MessageCircle,
  MapPin,
  ShieldCheck,
  Share2,
  BookOpen,
  ArrowLeft,
  DollarSign,
  Repeat,
  Gift,
  CheckCircle,
  Tag,
} from "lucide-react";

interface SingleBook {
  id: string;
  title: string;
  author: string;
  category: string;
  condition: string;
  dealType: string;
  price: number;
  status: string;
  images: string[];
  approxLocation?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    locationName?: string;
    image?: string;
    createdAt: string;
  };
}

export default function SingleBookPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [book, setBook] = useState<SingleBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [startingChat, setStartingChat] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/books/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.book) setBook(data.book);
        })
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  const handleStartChat = async () => {
    if (!user) {
      router.push(`/login?redirect=/books/${params.id}`);
      return;
    }

    if (!book) return;

    if (book.user.id === user.id) {
      router.push("/my-books");
      return;
    }

    setStartingChat(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id, sellerId: book.user.id }),
      });
      const data = await res.json();
      if (res.ok && data.roomId) {
        router.push(`/chat/${data.roomId}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStartingChat(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: book?.title || "BoiBinimoy Book",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm">বইয়ের বিস্তারিত লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">বইটি খুঁজে পাওয়া যায়নি</h2>
        <Link
          href="/explore"
          className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
        >
          এক্সপ্লোর ম্যাপে ফিরে যান
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back link */}
      <Link
        href="/explore"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        সকল বই ও ম্যাপে ফিরে যান
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        {/* Left Col: Images (5 cols) */}
        <div className="md:col-span-5 space-y-3">
          <div className="h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative">
            <img
              src={book.images?.[activeImage] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"}
              alt={book.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as any).src = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80";
              }}
            />
            {book.status === "SOLD" && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                <span className="px-4 py-2 bg-rose-600 text-white font-black rounded-xl text-sm uppercase tracking-wider">
                  বিক্রিত (Sold Out)
                </span>
              </div>
            )}
          </div>

          {book.images && book.images.length > 1 && (
            <div className="flex gap-2">
              {book.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImage === i
                      ? "border-emerald-600 shadow-xs"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Details & Actions (7 cols) */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Top Badges */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-black shadow-xs ${
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
                    ? "বিনিময় (Swap)"
                    : "ফ্রি (Giveaway)"}
                </span>

                <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700">
                  কন্ডিশন: {book.condition}
                </span>
              </div>

              <button
                onClick={handleShare}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                title="শেয়ার করুন"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {copied && (
              <p className="text-xs text-emerald-600 font-bold animate-in fade-in">
                ✓ লিংক কপি হয়েছে!
              </p>
            )}

            {/* Title & Author */}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {book.title}
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">লেখক: {book.author}</p>
            </div>

            {/* Location & Safety */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>লোকেশন: {book.approxLocation || "ক্যাম্পাস এরিয়া"}</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                🛡️ ব্যবহারকারীর সুরক্ষার জন্য সুনির্দিষ্ট বাসার বদলে ক্যাম্পাসের পাবলিক স্পটে মিটআপ করার পরামর্শ দেওয়া হচ্ছে।
              </p>
            </div>

            {/* Seller Card */}
            <div className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-200 text-emerald-900 font-bold flex items-center justify-center">
                {book.user.name.slice(0, 1)}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <span>{book.user.name}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </p>
                <p className="text-[11px] text-slate-500">
                  সদস্য হয়েছেন: {new Date(book.user.createdAt).toLocaleDateString("bn-BD")}
                </p>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-4 border-t border-slate-100">
            {book.status === "AVAILABLE" ? (
              <button
                onClick={handleStartChat}
                disabled={startingChat}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 text-base transition-all"
              >
                {startingChat ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    <span>বিক্রেতার সাথে চ্যাট ও দরদাম করুন (Make an Offer)</span>
                  </>
                )}
              </button>
            ) : (
              <div className="p-3 bg-slate-100 rounded-xl text-center text-xs font-bold text-slate-500">
                এই বইটি ইতোমধ্যে বিক্রি হয়ে গেছে
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
