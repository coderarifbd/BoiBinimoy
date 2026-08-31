"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  MessageCircle,
  BookOpen,
  User,
  Clock,
  CheckCircle,
  Search,
  ArrowRight,
} from "lucide-react";

interface ChatRoomItem {
  id: string;
  buyerId?: string;
  sellerId?: string;
  updatedAt: string;
  book?: {
    id: string;
    title: string;
    price: number;
    dealType: string;
    images: string[];
    status: string;
  } | null;
  buyer: {
    id: string;
    name: string;
    locationName?: string;
  };
  seller: {
    id: string;
    name: string;
    locationName?: string;
  };
  messages: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
}

export default function ChatInboxPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoomItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch("/api/chat")
        .then((res) => res.json())
        .then((data) => {
          if (data.rooms) setRooms(data.rooms);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!user && !loading) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">ইনবক্স দেখতে লগইন করুন</h2>
        <Link
          href="/login"
          className="inline-block mt-4 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs"
        >
          লগইন করুন
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-emerald-600" />
            অ্যাক্টিভ ইনবক্স ও চ্যাট
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            সকল ক্রেতা ও বিক্রেতার সাথে চলমান যোগাযোগ ও অফার
          </p>
        </div>

        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
          {rooms.length} টি চ্যাট
        </span>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span className="text-xs">ইনবক্স লোড হচ্ছে...</span>
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">কোনো চ্যাট মেসেজ নেই</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6 max-w-sm mx-auto">
            এক্সপ্লোর ম্যাপ থেকে যে কোনো বইয়ের বিক্রেতার সাথে চ্যাট শুরু করতে পারেন।
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl"
          >
            <BookOpen className="w-4 h-4" />
            বই এক্সপ্লোর করুন
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => {
            const isBuyer = room.buyer?.id === user?.id;
            const otherUser = isBuyer ? room.seller : room.buyer;
            const lastMessage = room.messages?.[0];

            return (
              <Link
                key={room.id}
                href={`/chat/${room.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4 hover:border-emerald-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Book thumbnail or User Avatar */}
                  {room.book?.images?.[0] ? (
                    <img
                      src={room.book.images[0]}
                      alt="Book"
                      className="w-12 h-14 object-cover rounded-xl border border-slate-100 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                      {otherUser?.name?.slice(0, 1) || "U"}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {otherUser?.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {isBuyer ? "বিক্রেতা" : "ক্রেতা"}
                      </span>
                    </div>

                    {room.book && (
                      <p className="text-xs text-emerald-700 font-semibold truncate mb-1">
                        📖 {room.book.title} ({room.book.dealType === "SELL" ? `৳${room.book.price}` : room.book.dealType})
                      </p>
                    )}

                    <p className="text-xs text-slate-500 truncate">
                      {lastMessage?.content || "নতুন কনভার্সেশন..."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400">
                    {new Date(room.updatedAt).toLocaleTimeString("bn-BD", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
