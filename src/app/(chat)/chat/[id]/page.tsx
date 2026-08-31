"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SAFE_MEETUP_SPOTS } from "@/lib/geo";
import { compressImageToWebP } from "@/lib/image-compress";
import { getPusherClient } from "@/lib/pusher";
import Link from "next/link";
import {
  Send,
  Image as ImageIcon,
  DollarSign,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  ShieldCheck,
  Tag,
  AlertCircle,
  Sparkles,
  ExternalLink,
  BookOpen,
} from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  content: string;
  image?: string | null;
  isOffer: boolean;
  offerAmount?: number | null;
  offerStatus?: string | null;
  meetupSpot?: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    image?: string | null;
  };
}

interface ChatRoomDetail {
  id: string;
  bookId?: string;
  book?: {
    id: string;
    title: string;
    author: string;
    price: number;
    dealType: string;
    condition: string;
    status: string;
    images: string[];
    approxLocation?: string;
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
  messages: Message[];
}

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [room, setRoom] = useState<ChatRoomDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Input states
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  // Modals / popups
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [meetupModalOpen, setMeetupModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Smooth scroll to bottom function
  const scrollToBottom = useCallback((smooth = true) => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight + 500,
          behavior: smooth ? "smooth" : "auto",
        });
      }
    }, 60);
  }, []);

  const fetchRoom = useCallback(async (isBackground = false) => {
    if (!params.id) return;
    try {
      const res = await fetch(`/api/chat/${params.id}`);
      const data = await res.json();
      if (res.ok && data.room) {
        setRoom(data.room);
        setMessages((prev) => {
          const incoming: Message[] = data.room.messages || [];
          if (incoming.length !== prev.length || JSON.stringify(incoming) !== JSON.stringify(prev)) {
            if (!isBackground || incoming.length > prev.length) {
              scrollToBottom(true);
            }
            return incoming;
          }
          return prev;
        });
      }
    } catch (err) {
      if (!isBackground) console.error("Fetch room error:", err);
    } finally {
      if (!isBackground) {
        setLoading(false);
        scrollToBottom(false);
      }
    }
  }, [params.id, scrollToBottom]);

  useEffect(() => {
    fetchRoom(false);
  }, [fetchRoom, user]);

  // Live fast polling (1.5s) for instant sync without window scroll
  useEffect(() => {
    if (!params.id) return;
    const interval = setInterval(() => {
      fetchRoom(true);
    }, 1500);

    return () => clearInterval(interval);
  }, [params.id, fetchRoom]);

  // Real-time Pusher Subscription
  useEffect(() => {
    if (!params.id) return;
    try {
      const pusher = getPusherClient();
      const channel = pusher.subscribe(`chat-${params.id}`);

      channel.bind("new-message", (newMessage: Message) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          scrollToBottom(true);
          return [...prev, newMessage];
        });
      });

      channel.bind("offer-updated", (updatedMessage: Message) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
        );
      });

      return () => {
        channel.unbind_all();
        channel.unsubscribe();
      };
    } catch (e) {
      console.warn("Pusher subscribe warning:", e);
    }
  }, [params.id, scrollToBottom]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length, scrollToBottom]);

  // 🚀 OPTIMISTIC INSTANT MESSAGE SENDING
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText("");

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      senderId: user?.id || "",
      content: textToSend,
      isOffer: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id || "",
        name: user?.name || "আমি",
        image: user?.image || null,
      },
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom(true);
    setSending(true);

    try {
      const res = await fetch(`/api/chat/${params.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: textToSend }),
      });

      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data.message : m))
        );
        scrollToBottom(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // Make an Offer
  const handleSendOffer = async () => {
    if (!offerPrice || isNaN(Number(offerPrice))) return;
    const priceVal = offerPrice;
    setOfferPrice("");
    setOfferModalOpen(false);

    const tempId = `temp-${Date.now()}`;
    const optimisticOffer: Message = {
      id: tempId,
      senderId: user?.id || "",
      content: `আমি ৳${priceVal} মূল্যে বইটি নিতে প্রস্তাব পাঠাচ্ছি।`,
      isOffer: true,
      offerAmount: Number(priceVal),
      offerStatus: "PENDING",
      createdAt: new Date().toISOString(),
      sender: { id: user?.id || "", name: user?.name || "আমি" },
    };

    setMessages((prev) => [...prev, optimisticOffer]);
    scrollToBottom(true);
    setSending(true);

    try {
      const res = await fetch(`/api/chat/${params.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isOffer: true,
          offerAmount: priceVal,
          content: `আমি ৳${priceVal} মূল্যে বইটি নিতে প্রস্তাব পাঠাচ্ছি।`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data.message : m))
        );
        scrollToBottom(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // Accept or Decline Offer
  const handleOfferResponse = async (messageId: string, status: "ACCEPTED" | "DECLINED") => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, offerStatus: status } : m))
    );

    try {
      const res = await fetch(`/api/chat/${params.id}/offer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, status }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? data.message : m))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send Safe Meetup Spot
  const handleSendMeetupSpot = async (spot: string) => {
    setMeetupModalOpen(false);
    const tempId = `temp-${Date.now()}`;
    const optimisticMeetup: Message = {
      id: tempId,
      senderId: user?.id || "",
      content: `মিটআপের নিরাপদ স্থান প্রস্তাব করা হয়েছে: 📍 ${spot}`,
      isOffer: false,
      meetupSpot: spot,
      createdAt: new Date().toISOString(),
      sender: { id: user?.id || "", name: user?.name || "আমি" },
    };

    setMessages((prev) => [...prev, optimisticMeetup]);
    scrollToBottom(true);
    setSending(true);

    try {
      const res = await fetch(`/api/chat/${params.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetupSpot: spot,
          content: `মিটআপের নিরাপদ স্থান প্রস্তাব করা হয়েছে: 📍 ${spot}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data.message : m))
        );
        scrollToBottom(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // In-Chat Image Upload
  const handleImageSend = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingImage(true);
    try {
      const file = e.target.files[0];
      const compressed = await compressImageToWebP(file, 400);

      const upRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image: compressed.dataUrl, folder: "boibinimoy_chat" }),
      });
      const upData = await upRes.json();
      const finalImgUrl = upData.url || compressed.dataUrl;

      const res = await fetch(`/api/chat/${params.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: finalImgUrl,
          content: "বইয়ের বর্তমান পাতার ছবি শেয়ার করা হয়েছে",
        }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
        scrollToBottom(true);
      }
    } catch (err) {
      console.error("Chat image error:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <span className="text-xs">চ্যাট লোড হচ্ছে...</span>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">চ্যাটরুম পাওয়া যায়নি</h2>
        <Link
          href="/chat"
          className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
        >
          ইনবক্সে ফিরে যান
        </Link>
      </div>
    );
  }

  const isBuyer = room.buyer.id === user?.id;
  const otherUser = isBuyer ? room.seller : room.buyer;

  return (
    <div className="fixed inset-x-0 top-16 bottom-0 z-10 bg-slate-100 flex justify-center overflow-hidden">
      <div className="w-full max-w-4xl h-full flex flex-col p-2 sm:p-4">
        {/* ================= 1. ALWAYS STICKY TOP HEADER & PINNED BOOK CARD ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 mb-2 shrink-0">
          {/* User bar */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Link
                href="/chat"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                title="ইনবক্সে ফিরে যান"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                {otherUser.name.slice(0, 1)}
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <span>{otherUser.name}</span>
                  <span className="text-[10px] text-slate-400">({isBuyer ? "বিক্রেতা" : "ক্রেতা"})</span>
                </h2>
                <p className="text-[10px] text-emerald-600 font-medium">
                  📍 {otherUser.locationName || "ক্যাম্পাস"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Make an Offer Button (for buyer) */}
              {isBuyer && room.book?.dealType === "SELL" && (
                <button
                  onClick={() => setOfferModalOpen(true)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs transition-colors"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Make an Offer
                </button>
              )}

              {/* Safe Meetup Spot Button */}
              <button
                onClick={() => setMeetupModalOpen(true)}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px] flex items-center gap-1 border border-emerald-200 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                মিটআপ স্পট
              </button>
            </div>
          </div>

          {/* PINNED BOOK REFERENCE CARD */}
          {room.book && (
            <div className="bg-emerald-50/80 rounded-xl p-2 flex items-center justify-between gap-3 border border-emerald-200/80">
              <div className="flex items-center gap-2.5 min-w-0">
                {room.book.images?.[0] ? (
                  <img
                    src={room.book.images[0]}
                    alt="Pinned Book"
                    className="w-9 h-11 object-cover rounded-lg border border-white shadow-xs shrink-0 bg-emerald-200"
                    onError={(e) => {
                      (e.target as any).src = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80";
                    }}
                  />
                ) : (
                  <div className="w-9 h-11 bg-emerald-200 text-emerald-900 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase font-black text-emerald-800 bg-emerald-200 px-1.5 py-0.5 rounded">
                      PINNED BOOK
                    </span>
                    <span className="text-[11px] font-bold text-slate-900 truncate">
                      {room.book.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] mt-0.5">
                    <span className="font-bold text-emerald-700">
                      মূল্য: {room.book.dealType === "SELL" ? `৳${room.book.price}` : room.book.dealType === "SWAP" ? "বিনিময় (Swap)" : "ফ্রি (Giveaway)"}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">কন্ডিশন: {room.book.condition}</span>
                  </div>
                </div>
              </div>

              <Link
                href={`/books/${room.book.id}`}
                className="text-[11px] font-bold text-emerald-700 hover:underline shrink-0 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs"
              >
                বই পেজ
              </Link>
            </div>
          )}
        </div>

        {/* ================= 2. CHAT MESSAGES SCROLL AREA ================= */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-xs scroll-smooth"
        >
          {/* Safety Banner */}
          <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>মেসেঞ্জারেই কথা বলুন ও দরদাম করুন। মেসেজ সাথে সাথে লাইভ সিঙ্ক হচ্ছে।</span>
          </div>

          {messages.map((msg) => {
            const isMine = msg.senderId === user?.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
              >
                {/* SPECIAL: OFFER MESSAGE CARD */}
                {msg.isOffer ? (
                  <div className="max-w-xs sm:max-w-sm w-full p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm text-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900 border-b border-amber-200 pb-1.5">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        প্রস্তাবিত অফার (Price Offer)
                      </span>
                      <span className="text-base font-black text-amber-700">
                        ৳{msg.offerAmount}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{msg.content}</p>

                    {/* Offer Status & Action Buttons */}
                    <div className="pt-1">
                      {msg.offerStatus === "PENDING" ? (
                        !isMine ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOfferResponse(msg.id, "ACCEPTED")}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Accept (রাজি)
                            </button>
                            <button
                              onClick={() => handleOfferResponse(msg.id, "DECLINED")}
                              className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Decline (বাতিল)
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded-md">
                            ⏳ বিক্রেতার সম্মতির অপেক্ষায়...
                          </span>
                        )
                      ) : msg.offerStatus === "ACCEPTED" ? (
                        <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          অফারটি গৃহীত হয়েছে (Offer Accepted)!
                        </div>
                      ) : (
                        <div className="p-1.5 bg-rose-100 text-rose-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          অফারটি বাতিল হয়েছে
                        </div>
                      )}
                    </div>
                  </div>
                ) : msg.meetupSpot ? (
                  /* SPECIAL: MEETUP SPOT CARD */
                  <div className="max-w-xs sm:max-w-sm p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-800 space-y-1.5 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      প্রস্তাবিত নিরাপদ মিটআপ স্পট
                    </div>
                    <p className="text-xs font-bold text-slate-900 bg-white p-2 rounded-xl border border-emerald-100">
                      📍 {msg.meetupSpot}
                    </p>
                  </div>
                ) : (
                  /* STANDARD TEXT / IMAGE BUBBLE */
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                      isMine
                        ? "bg-emerald-600 text-white rounded-br-xs"
                        : "bg-slate-100 text-slate-900 rounded-bl-xs"
                    }`}
                  >
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Chat Attachment"
                        className="w-full max-h-60 object-cover rounded-xl mb-2 border border-black/10"
                      />
                    )}
                    <p>{msg.content}</p>
                  </div>
                )}

                <span className="text-[9px] text-slate-400 mt-1 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString("bn-BD", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
        </div>

        {/* ================= 3. BOTTOM INPUT BAR ================= */}
        <form
          onSubmit={handleSendMessage}
          className="mt-2 bg-white rounded-2xl border border-slate-200 p-2 flex items-center gap-2 shrink-0 shadow-sm"
        >
          {/* Photo send */}
          <label className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-emerald-600 cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSend}
              disabled={uploadingImage}
            />
            {uploadingImage ? (
              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </label>

          {/* Text Input */}
          <input
            type="text"
            placeholder="মেসেজ লিখুন..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 text-xs sm:text-sm outline-hidden px-2 text-slate-900"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* MODAL: MAKE AN OFFER */}
        {offerModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <DollarSign className="w-5 h-5 text-amber-500" />
                মেক অ্যান অফার (Make an Offer)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                বিক্রেতার সাথে আপনার প্রস্তাবিত দাম পাঠান।
              </p>

              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  আপনার প্রস্তাবিত মূল্য (টাকা)
                </label>
                <input
                  type="number"
                  placeholder="যেমন: 220"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm outline-hidden focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOfferModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleSendOffer}
                  disabled={!offerPrice}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  অফার পাঠান
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: SAFE MEETUP SPOTS */}
        {meetupModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  নিরাপদ মিটআপ স্পট নির্বাচন করুন
                </h3>
                <button
                  onClick={() => setMeetupModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                পরিচিত পাবলিক প্লেস সিলেক্ট করে অন্যজনকে পাঠান:
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {SAFE_MEETUP_SPOTS.map((spot, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMeetupSpot(spot)}
                    className="w-full p-2.5 text-left rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-xs font-medium text-slate-800 transition-colors flex items-center gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{spot}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
