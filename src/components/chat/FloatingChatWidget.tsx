"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChatWidget } from "@/context/ChatWidgetContext";
import { SAFE_MEETUP_SPOTS } from "@/lib/geo";
import { compressImageToWebP } from "@/lib/image-compress";
import { getPusherClient } from "@/lib/pusher";
import Link from "next/link";
import {
  X,
  Minus,
  Maximize2,
  Send,
  Image as ImageIcon,
  DollarSign,
  MapPin,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  MessageCircle,
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

interface RoomData {
  id: string;
  book?: {
    id: string;
    title: string;
    price: number;
    dealType: string;
    condition: string;
    images: string[];
    approxLocation?: string;
  } | null;
  buyer: { id: string; name: string; locationName?: string };
  seller: { id: string; name: string; locationName?: string };
  messages: Message[];
}

export default function FloatingChatWidget() {
  const { user } = useAuth();
  const { chatState, closeChat, toggleMinimize } = useChatWidget();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Input states
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [meetupModalOpen, setMeetupModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchRoomMessages = useCallback(async (activeRoomId: string, isBackground = false) => {
    try {
      const roomRes = await fetch(`/api/chat/${activeRoomId}`);
      const roomJson = await roomRes.json();
      if (roomRes.ok && roomJson.room) {
        setRoomData(roomJson.room);
        setMessages((prev) => {
          const incoming = roomJson.room.messages || [];
          if (incoming.length !== prev.length || JSON.stringify(incoming) !== JSON.stringify(prev)) {
            return incoming;
          }
          return prev;
        });
      }
    } catch (err) {
      if (!isBackground) console.error(err);
    }
  }, []);

  // Initialize or fetch room whenever chatState changes
  useEffect(() => {
    if (!chatState.isOpen) return;

    if (!user) {
      setError("চ্যাট করতে অনুগ্রহ করে লগইন করুন");
      return;
    }

    setError("");
    setLoading(true);

    const initChat = async () => {
      try {
        let activeRoomId = chatState.roomId;

        // If no roomId passed, create or find room with bookId & sellerId
        if (!activeRoomId && chatState.sellerId) {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookId: chatState.bookId,
              sellerId: chatState.sellerId,
            }),
          });
          const data = await res.json();
          if (res.ok && data.roomId) {
            activeRoomId = data.roomId;
          } else {
            throw new Error(data.error || "চ্যাট শুরু করা যায়নি");
          }
        }

        if (activeRoomId) {
          setRoomId(activeRoomId);
          await fetchRoomMessages(activeRoomId, false);
        }
      } catch (err: any) {
        console.error("Widget init error:", err);
        setError(err.message || "চ্যাট লোড করা যায়নি");
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [chatState.isOpen, chatState.bookId, chatState.sellerId, chatState.roomId, user, fetchRoomMessages]);

  // Live polling every 1.5s for instant multi-user messaging
  useEffect(() => {
    if (!roomId || !chatState.isOpen) return;
    const interval = setInterval(() => {
      fetchRoomMessages(roomId, true);
    }, 1500);

    return () => clearInterval(interval);
  }, [roomId, chatState.isOpen, fetchRoomMessages]);

  // Realtime Pusher event listener
  useEffect(() => {
    if (!roomId) return;
    try {
      const pusher = getPusherClient();
      const channel = pusher.subscribe(`chat-${roomId}`);

      channel.bind("new-message", (newMsg: Message) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      });

      channel.bind("offer-updated", (updatedMsg: Message) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
        );
      });

      return () => {
        channel.unbind_all();
        channel.unsubscribe();
      };
    } catch (e) {
      console.warn("Pusher warning:", e);
    }
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatState.isMinimized]);

  // 🚀 OPTIMISTIC INSTANT MESSAGE SENDING
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !roomId || sending) return;

    const msgContent = inputText.trim();
    setInputText("");

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      senderId: user?.id || "",
      content: msgContent,
      isOffer: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id || "",
        name: user?.name || "আমি",
        image: user?.image || null,
      },
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setSending(true);

    try {
      const res = await fetch(`/api/chat/${roomId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: msgContent }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data.message : m))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // Send Offer
  const handleSendOffer = async () => {
    if (!offerPrice || !roomId) return;
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
    setSending(true);

    try {
      const res = await fetch(`/api/chat/${roomId}/message`, {
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // Respond to Offer
  const handleOfferResponse = async (messageId: string, status: "ACCEPTED" | "DECLINED") => {
    if (!roomId) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, offerStatus: status } : m))
    );

    try {
      const res = await fetch(`/api/chat/${roomId}/offer`, {
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

  // Send Meetup Spot
  const handleSendMeetupSpot = async (spot: string) => {
    if (!roomId) return;
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
    setSending(true);

    try {
      const res = await fetch(`/api/chat/${roomId}/message`, {
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // In-Chat Photo Upload
  const handleImageSend = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !roomId) return;
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
      const finalUrl = upData.url || compressed.dataUrl;

      const res = await fetch(`/api/chat/${roomId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: finalUrl,
          content: "বইয়ের পাতার ছবি শেয়ার করা হয়েছে",
        }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  if (!chatState.isOpen) return null;

  const isBuyer = roomData?.buyer.id === user?.id;
  const otherUser = isBuyer ? roomData?.seller : roomData?.buyer;
  const otherUserName = otherUser?.name || chatState.sellerName || "বিক্রেতা";
  const pinnedBook = roomData?.book || (chatState.bookTitle ? {
    id: chatState.bookId,
    title: chatState.bookTitle,
    price: chatState.bookPrice || 0,
    images: chatState.bookImage ? [chatState.bookImage] : [],
    dealType: "SELL",
    condition: "Good",
  } : null);

  return (
    <div
      className={`fixed right-3 sm:right-6 bottom-0 z-50 w-[350px] sm:w-[380px] bg-white rounded-t-3xl border border-slate-300 shadow-2xl transition-all duration-300 flex flex-col ${
        chatState.isMinimized ? "h-14" : "h-[500px]"
      }`}
    >
      {/* 1. TOP HEADER (Facebook Desktop Style) */}
      <div className="bg-slate-900 text-white px-4 py-3 rounded-t-3xl flex items-center justify-between shadow-xs select-none cursor-pointer shrink-0">
        <div
          className="flex items-center gap-2.5 min-w-0 flex-1"
          onClick={toggleMinimize}
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
              {otherUserName.slice(0, 1)}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
          </div>

          <div className="min-w-0">
            <h3 className="font-bold text-xs truncate leading-tight">
              {otherUserName}
            </h3>
            <span className="text-[10px] text-emerald-400 font-medium block">
              সরাসরি চ্যাট ও অফার
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 text-slate-300">
          {roomId && (
            <Link
              href={`/chat/${roomId}`}
              title="ফুল পেইজে দেখুন"
              className="p-1 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Link>
          )}

          <button
            onClick={toggleMinimize}
            className="p-1 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
            title={chatState.isMinimized ? "এক্সপ্যান্ড করুন" : "মিনিমাইজ করুন"}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={closeChat}
            className="p-1 rounded-lg hover:bg-rose-600 hover:text-white transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. BODY (WHEN EXPANDED) */}
      {!chatState.isMinimized && (
        <>
          {/* PINNED BOOK REFERENCE CARD (STICKY TOP) */}
          {pinnedBook && (
            <div className="bg-emerald-50/90 border-b border-emerald-200/80 p-2.5 flex items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {pinnedBook.images?.[0] ? (
                  <img
                    src={pinnedBook.images[0]}
                    alt="Book"
                    className="w-8 h-10 object-cover rounded-md border border-white shadow-xs shrink-0 bg-emerald-200"
                    onError={(e) => {
                      (e.target as any).src = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80";
                    }}
                  />
                ) : (
                  <div className="w-8 h-10 bg-emerald-200 rounded-md flex items-center justify-center text-xs">
                    <BookOpen className="w-4 h-4 text-emerald-800" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    পিনড বই
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {pinnedBook.title}
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-700">
                    ৳{pinnedBook.price}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Make Offer & Meetup */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setOfferModalOpen(true)}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold shadow-xs flex items-center gap-0.5"
                  title="অফার পাঠান"
                >
                  <DollarSign className="w-3 h-3" />
                  অফার
                </button>

                <button
                  onClick={() => setMeetupModalOpen(true)}
                  className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-0.5"
                  title="নিরাপদ স্পট"
                >
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  স্পট
                </button>
              </div>
            </div>
          )}

          {/* MESSAGES STREAM */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/50">
            {error ? (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 text-center">
                {error}
                {!user && (
                  <Link
                    href="/login"
                    className="block mt-2 font-bold text-emerald-700 hover:underline"
                  >
                    লগইন করুন →
                  </Link>
                )}
              </div>
            ) : loading ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                চ্যাট লোড হচ্ছে...
              </div>
            ) : messages.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-1">
                <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="font-semibold text-slate-700">কথোপকথন শুরু করুন!</p>
                <p className="text-[11px]">দাম প্রস্তাব করুন অথবা বইটির ব্যাপারে সরাসরি মেসেজ পাঠান।</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                  >
                    {/* OFFER CARD */}
                    {msg.isOffer ? (
                      <div className="max-w-[85%] p-3 rounded-2xl bg-amber-50 border border-amber-200 text-slate-800 space-y-1.5 shadow-xs">
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 border-b border-amber-200 pb-1">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            প্রস্তাবিত অফার
                          </span>
                          <span className="text-sm font-black text-amber-700">
                            ৳{msg.offerAmount}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600">{msg.content}</p>

                        {/* Status / Accept buttons */}
                        <div className="pt-1">
                          {msg.offerStatus === "PENDING" ? (
                            !isMine ? (
                              <div className="flex gap-1.5 pt-1">
                                <button
                                  onClick={() => handleOfferResponse(msg.id, "ACCEPTED")}
                                  className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleOfferResponse(msg.id, "DECLINED")}
                                  className="flex-1 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold"
                                >
                                  Decline
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                                ⏳ বিক্রেতার অপেক্ষায়...
                              </span>
                            )
                          ) : msg.offerStatus === "ACCEPTED" ? (
                            <div className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              অফার গৃহীত হয়েছে!
                            </div>
                          ) : (
                            <div className="text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              অফার বাতিল হয়েছে
                            </div>
                          )}
                        </div>
                      </div>
                    ) : msg.meetupSpot ? (
                      /* MEETUP SPOT */
                      <div className="max-w-[85%] p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-800 space-y-1 shadow-xs text-xs">
                        <span className="font-bold text-emerald-900 text-[10px] block">
                          📍 নিরাপদ মিটআপ স্পট:
                        </span>
                        <p className="font-bold text-slate-800 text-[11px] bg-white p-1.5 rounded-lg border border-emerald-100">
                          {msg.meetupSpot}
                        </p>
                      </div>
                    ) : (
                      /* STANDARD TEXT BUBBLE */
                      <div
                        className={`max-w-[85%] rounded-2xl p-2.5 text-xs leading-relaxed ${
                          isMine
                            ? "bg-emerald-600 text-white rounded-br-xs"
                            : "bg-white text-slate-900 border border-slate-200 rounded-bl-xs shadow-xs"
                        }`}
                      >
                        {msg.image && (
                          <img
                            src={msg.image}
                            alt="Attachment"
                            className="w-full max-h-48 object-cover rounded-lg mb-1.5"
                          />
                        )}
                        <p>{msg.content}</p>
                      </div>
                    )}

                    <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString("bn-BD", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 3. BOTTOM INPUT BAR */}
          <form
            onSubmit={handleSendMessage}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5 shrink-0"
          >
            <label className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-600 rounded-lg cursor-pointer transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSend}
                disabled={uploadingImage}
              />
              {uploadingImage ? (
                <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
            </label>

            <input
              type="text"
              placeholder="মেসেজ লিখুন..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-xs outline-hidden px-2 py-1 text-slate-900 bg-slate-50 rounded-lg border border-slate-200 focus:border-emerald-500"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* POPUP: MAKE AN OFFER */}
          {offerModalOpen && (
            <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 rounded-t-3xl">
              <div className="bg-white rounded-2xl p-4 w-full shadow-2xl border border-slate-200 animate-in fade-in">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1 mb-2">
                  <DollarSign className="w-4 h-4 text-amber-500" />
                  প্রস্তাবিত মূল্য দিন (Make an Offer)
                </h4>
                <input
                  type="number"
                  placeholder="যেমন: 250"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold mb-3 outline-hidden focus:border-emerald-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOfferModalOpen(false)}
                    className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOffer}
                    disabled={!offerPrice}
                    className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs"
                  >
                    অফার পাঠান
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* POPUP: SAFE MEETUP SPOTS */}
          {meetupModalOpen && (
            <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 rounded-t-3xl">
              <div className="bg-white rounded-2xl p-4 w-full shadow-2xl border border-slate-200 animate-in fade-in max-h-[85%] flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    নিরাপদ স্পট সিলেক্ট করুন
                  </h4>
                  <button
                    onClick={() => setMeetupModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
                  {SAFE_MEETUP_SPOTS.map((spot, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMeetupSpot(spot)}
                      className="w-full p-2 text-left rounded-lg border border-slate-200 hover:bg-emerald-50 hover:border-emerald-400 text-[11px] font-medium text-slate-800 transition-colors block truncate"
                    >
                      📍 {spot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
