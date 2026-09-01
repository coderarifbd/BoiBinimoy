"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Library,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Tag,
  ExternalLink,
  MessageCircle,
  Repeat,
} from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  condition: string;
  dealType: string;
  price: number;
  status: "AVAILABLE" | "SOLD" | "REMOVED";
  images: string[];
  approxLocation?: string;
  createdAt: string;
}

export default function MyBooksPage() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  const fetchMyBooks = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/books?userId=${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setBooks(data.books || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBooks();
  }, [user]);

  // 1-Tap Toggle Available <-> Sold
  const handleToggleStatus = async (bookId: string, currentStatus: string) => {
    setToggleLoading(bookId);
    const newStatus = currentStatus === "AVAILABLE" ? "SOLD" : "AVAILABLE";
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setBooks((prev) =>
          prev.map((b) => (b.id === bookId ? { ...b, status: newStatus as any } : b))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setToggleLoading(null);
    }
  };

  const handleDelete = async (bookId: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই বইটি মুছে ফেলতে চান?")) return;
    try {
      const res = await fetch(`/api/books/${bookId}`, { method: "DELETE" });
      if (res.ok) {
        setBooks((prev) => prev.filter((b) => b.id !== bookId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user && !loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <Library className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">আপনার বইয়ের তালিকা দেখতে লগইন করুন</h2>
        <Link
          href="/login"
          className="inline-block mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors"
        >
          লগইন করুন
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Library className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>আমার বইসমূহ (My Inventory)</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            আপনার আপলোড করা সকল বই ম্যানেজ করুন এবং হাতবদল হলে স্ট্যাটাস পরিবর্তন করুন
          </p>
        </div>

        <Link
          href="/list-book"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs text-sm transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>নতুন বই পোস্ট করুন</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 dark:text-slate-500">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm">বইয়ের তালিকা লোড হচ্ছে...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
          <Library className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">আপনার কোনো বই লিস্ট করা নেই</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            আপনার অব্যবহৃত বা পুরনো বইগুলো আজই পোস্ট করুন এবং অন্য শিক্ষার্থীদের সাহায্য করুন।
          </p>
          <Link
            href="/list-book"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>প্রথম বই পোস্ট করুন</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all overflow-hidden flex flex-col ${
                book.status === "SOLD"
                  ? "border-slate-200 dark:border-slate-800 opacity-75 bg-slate-50 dark:bg-slate-900/60"
                  : "border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500/60 hover:shadow-md"
              }`}
            >
              {/* Image & Badges */}
              <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img
                  src={book.images?.[0] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
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
                  <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-900/80 text-white backdrop-blur-xs">
                    {book.condition}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs ${
                      book.status === "AVAILABLE"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-700 text-slate-200"
                    }`}
                  >
                    {book.status === "AVAILABLE" ? "সক্রিয় (Available)" : "বিক্রিত (Sold)"}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 text-sm mb-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">লেখক: {book.author}</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate mb-4">
                    📍 {book.approxLocation || "ক্যাম্পাস এরিয়া"}
                  </p>
                </div>

                {/* Actions & 1-Tap Toggle */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(book.id, book.status)}
                    disabled={toggleLoading === book.id}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      book.status === "AVAILABLE"
                        ? "bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {toggleLoading === book.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Repeat className="w-3.5 h-3.5" />
                        <span>
                          {book.status === "AVAILABLE"
                            ? "হাতবদল হয়েছে (Mark as Sold)"
                            : "পুনরায় সক্রিয় করুন (Mark as Available)"}
                        </span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <Link
                      href={`/books/${book.id}`}
                      className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>পেজ ভিউ</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(book.id)}
                      className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold flex items-center gap-1 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>মুছে ফেলুন</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
