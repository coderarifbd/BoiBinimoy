"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, HelpCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useChatWidget } from "@/context/ChatWidgetContext";

interface BookRequestItem {
  id: string;
  title: string;
  author?: string | null;
  description?: string | null;
  approxLocation?: string | null;
  createdAt: string | Date;
  user: {
    id: string;
    name: string;
    locationName?: string | null;
  };
}

export default function HomeRequestCards({
  requests,
}: {
  requests: BookRequestItem[];
}) {
  const { user } = useAuth();
  const { openChat } = useChatWidget();
  const router = useRouter();

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

        // Open directly in floating chat widget!
        openChat({
          roomId: data.roomId,
          sellerName: reqItem.user.name,
          bookTitle: reqItem.title,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!requests || requests.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>বইয়ের খোঁজ চাই</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            পাঠকদের কাঙ্ক্ষিত বইয়ের তালিকা
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            অন্য কোনো শিক্ষার্থীর দরকারি বইটি আপনার কাছে থাকলে সরাসরি নক দিন
          </p>
        </div>

        <Link
          href="/requests"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl self-start sm:self-auto shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span>সব রিকোয়েস্ট দেখুন</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {requests.map((reqItem) => (
          <div
            key={reqItem.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500/60 hover:shadow-md transition-all flex flex-col justify-between gap-4"
          >
            <div>
              {/* Header Badge & Date */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                  🔍 বইয়ের খোঁজ
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  {new Date(reqItem.createdAt).toLocaleDateString("bn-BD")}
                </span>
              </div>

              {/* Title & Author */}
              <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 mb-0.5">
                {reqItem.title}
              </h3>
              {reqItem.author && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                  লেখক: {reqItem.author}
                </p>
              )}

              {/* Description quote box */}
              {reqItem.description && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 mb-3.5 leading-relaxed italic">
                  "{reqItem.description}"
                </p>
              )}

              {/* User info */}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                  {reqItem.user?.name?.slice(0, 1) || "U"}
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {reqItem.user?.name}
                </span>
                <span>•</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium truncate">
                  📍 {reqItem.approxLocation || "ক্যাম্পাস"}
                </span>
              </div>
            </div>

            {/* Bottom action button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                আশেপাশে বইটি আছে?
              </span>
              <button
                type="button"
                onClick={() => handleStartChatWithRequester(reqItem)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>আমার কাছে আছে (নক দিন)</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
