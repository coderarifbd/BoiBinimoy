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
  Sparkles,
  BellRing,
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
  hasUnread?: boolean;
  unreadCount?: number;
}

export default function ChatInboxPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoomItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInbox = () => {
    if (user) {
      fetch("/api/chat")
        .then((res) => res.json())
        .then((data) => {
          if (data.rooms) setRooms(data.rooms);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchInbox();
    // Poll every 3 seconds for live unread updates
    const interval = setInterval(fetchInbox, 3000);
    return () => clearInterval(interval);
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

  const unreadRoomsCount = rooms.filter((r) => r.hasUnread).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-emerald-600" />
            <span>অ্যাক্টিভ ইনবক্স ও চ্যাট</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            সকল ক্রেতা ও বিক্রেতার সাথে চলমান যোগাযোগ ও অফার
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadRoomsCount > 0 && (
            <span className="px-3 py-1 bg-rose-600 text-white font-black text-xs rounded-full shadow-sm animate-pulse flex items-center gap-1">
              <BellRing className="w-3.5 h-3.5" />
              <span>{unreadRoomsCount} টি অপঠিত</span>
            </span>
          )}
          <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-full">
            {rooms.length} টি চ্যাট
          </span>
        </div>
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
        <div className="space-y-3.5">
          {rooms.map((room) => {
            const isBuyer = room.buyer?.id === user?.id;
            const otherUser = isBuyer ? room.seller : room.buyer;
            const lastMessage = room.messages?.[0];
            const isUnread = !!room.hasUnread;

            return (
              <Link
                key={room.id}
                href={`/chat/${room.id}`}
                className={`rounded-2xl p-4 flex items-center justify-between gap-4 transition-all group ${
                  isUnread
                    ? "bg-emerald-50/90 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-400/20"
                    : "bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Book thumbnail or User Avatar with Unread Badge Indicator */}
                  <div className="relative shrink-0">
                    {room.book?.images?.[0] ? (
                      <img
                        src={room.book.images[0]}
                        alt="Book"
                        className={`w-13 h-15 object-cover rounded-xl border ${
                          isUnread ? "border-emerald-500 ring-2 ring-emerald-300" : "border-slate-100"
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-13 h-13 rounded-xl font-black text-sm flex items-center justify-center ${
                          isUnread
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {otherUser?.name?.slice(0, 1) || "U"}
                      </div>
                    )}

                    {isUnread && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 border-2 border-white rounded-full animate-ping"></span>
                    )}
                    {isUnread && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 border-2 border-white rounded-full"></span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`text-sm truncate ${
                          isUnread ? "font-black text-slate-950 text-base" : "font-bold text-slate-800"
                        }`}
                      >
                        {otherUser?.name}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          isUnread ? "bg-emerald-200 text-emerald-900 font-bold" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isBuyer ? "বিক্রেতা" : "ক্রেতা"}
                      </span>
                      {isUnread && (
                        <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-md shadow-xs animate-pulse">
                          নতুন মেসেজ
                        </span>
                      )}
                    </div>

                    {room.book && (
                      <p
                        className={`text-xs truncate mb-1 ${
                          isUnread ? "text-emerald-900 font-bold" : "text-emerald-700 font-semibold"
                        }`}
                      >
                        📖 {room.book.title} ({room.book.dealType === "SELL" ? `৳${room.book.price}` : room.book.dealType})
                      </p>
                    )}

                    <p
                      className={`text-xs truncate ${
                        isUnread
                          ? "font-bold text-slate-900 bg-white/90 px-2 py-0.5 rounded-md inline-block border border-emerald-200 shadow-2xs"
                          : "text-slate-500"
                      }`}
                    >
                      {lastMessage?.content || "নতুন কনভার্সেশন..."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={`text-[10px] ${
                      isUnread ? "font-bold text-emerald-900" : "text-slate-400"
                    }`}
                  >
                    {new Date(room.updatedAt).toLocaleTimeString("bn-BD", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  {isUnread ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors">
                      <span>পড়ুন</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
