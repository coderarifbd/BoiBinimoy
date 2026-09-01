"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useChatWidget } from "@/context/ChatWidgetContext";
import { useTheme } from "@/context/ThemeContext";
import {
  BookOpen,
  MapPin,
  MessageCircle,
  Gift,
  PlusCircle,
  ShieldAlert,
  User,
  LogOut,
  Menu,
  X,
  Library,
  Search,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Sun,
  Moon,
} from "lucide-react";

interface MiniChatRoom {
  id: string;
  book?: {
    id: string;
    title: string;
    images: string[];
    price: number;
    dealType: string;
  } | null;
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
  messages: Array<{ id: string; content: string; createdAt: string }>;
  hasUnread?: boolean;
  unreadCount?: number;
  updatedAt: string;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { openChat } = useChatWidget();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [chatDropdownOpen, setChatDropdownOpen] = useState(false);

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentRooms, setRecentRooms] = useState<MiniChatRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const chatDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Poll for unread message count
  const fetchUnreadAndRooms = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await fetch("/api/chat/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      // ignore silently
    }
  };

  const fetchRecentChats = async () => {
    if (!user) return;
    setLoadingRooms(true);
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setRecentRooms(data.rooms || []);
      }
    } catch (err) {
      // ignore
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchUnreadAndRooms();
    const timer = setInterval(fetchUnreadAndRooms, 4000);
    return () => clearInterval(timer);
  }, [user, pathname]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatDropdownRef.current && !chatDropdownRef.current.contains(event.target as Node)) {
        setChatDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleChatDropdown = () => {
    if (!chatDropdownOpen) {
      fetchRecentChats();
    }
    setChatDropdownOpen(!chatDropdownOpen);
  };

  const handleOpenFloatingChat = (room: MiniChatRoom) => {
    const isBuyer = room.buyer?.id === user?.id;
    const otherUser = isBuyer ? room.seller : room.buyer;

    openChat({
      roomId: room.id,
      bookId: room.book?.id,
      sellerName: otherUser?.name || "ব্যবহারকারী",
      bookTitle: room.book?.title,
      bookPrice: room.book?.price,
      bookImage: room.book?.images?.[0],
    });

    setChatDropdownOpen(false);
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-emerald-100 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 bg-clip-text text-transparent leading-none tracking-tight">
                BoiBinimoy
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400 tracking-wider mt-0.5 leading-none">
                বইবিনিময়
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              href="/explore"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive("/explore")
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>এক্সপ্লোর ও ম্যাপ</span>
            </Link>

            <Link
              href="/requests"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive("/requests")
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>বইয়ের খোঁজ চাই</span>
            </Link>

            <Link
              href="/wallet"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive("/wallet")
                  ? "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/30"
              }`}
            >
              <Gift className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>১০ বন্ধুতে ৫০৳</span>
              {user && (
                <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                  {user.points} pts
                </span>
              )}
            </Link>

            {user?.isSuperAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                  pathname.startsWith("/admin")
                    ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60"
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>সুপার অ্যাডমিন</span>
              </Link>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* 🌙 SUN / MOON THEME TOGGLE BUTTON */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-amber-300 hover:border-emerald-300 dark:hover:border-slate-700 transition-all cursor-pointer shadow-2xs"
              title={theme === "dark" ? "লাইট থিমে পরিবর্তন করুন" : "ডার্ক থিমে পরিবর্তন করুন (চোখের আরাম)"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 animate-in spin-in-180 duration-300" />
              )}
            </button>

            {/* List Book CTA */}
            <Link
              href="/list-book"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 hover:shadow-lg transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">বই পোস্ট করুন</span>
              <span className="sm:hidden">লিস্ট</span>
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                {/* 💬 FACEBOOK-STYLE MESSENGER CHAT DROPDOWN */}
                <div ref={chatDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={handleToggleChatDropdown}
                    className={`p-2.5 rounded-xl border transition-colors relative flex items-center justify-center cursor-pointer ${
                      chatDropdownOpen || pathname.startsWith("/chat")
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                    title="মেসেঞ্জার ও চ্যাট"
                  >
                    <MessageCircle className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Popup */}
                  {chatDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">মেসেজ ও ইনবক্স</h3>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10px] font-bold rounded-full">
                              {unreadCount} টি নতুন
                            </span>
                          )}
                        </div>
                        <Link
                          href="/chat"
                          onClick={() => setChatDropdownOpen(false)}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          ইনবক্স পেজ
                        </Link>
                      </div>

                      {/* Chats List */}
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                        {loadingRooms ? (
                          <div className="py-8 text-center text-slate-400">
                            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                            <span className="text-xs">লোড হচ্ছে...</span>
                          </div>
                        ) : recentRooms.length === 0 ? (
                          <div className="py-8 text-center space-y-1">
                            <MessageCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">কোনো চ্যাট মেসেজ নেই</p>
                          </div>
                        ) : (
                          recentRooms.map((room) => {
                            const isBuyer = room.buyer?.id === user?.id;
                            const otherUser = isBuyer ? room.seller : room.buyer;
                            const lastMsg = room.messages?.[0];
                            const isUnread = !!room.hasUnread;

                            return (
                              <div
                                key={room.id}
                                onClick={() => handleOpenFloatingChat(room)}
                                className={`p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer transition-colors ${
                                  isUnread ? "bg-emerald-50/70 dark:bg-emerald-950/40" : ""
                                }`}
                              >
                                <div className="relative shrink-0">
                                  {room.book?.images?.[0] ? (
                                    <img
                                      src={room.book.images[0]}
                                      alt="Book"
                                      className="w-10 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                                      {otherUser?.name?.slice(0, 1) || "U"}
                                    </div>
                                  )}
                                  {isUnread && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-600 border-2 border-white dark:border-slate-900 rounded-full"></span>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <span
                                      className={`text-xs truncate ${
                                        isUnread ? "font-black text-slate-950 dark:text-white" : "font-bold text-slate-800 dark:text-slate-200"
                                      }`}
                                    >
                                      {otherUser?.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                                      {new Date(room.updatedAt).toLocaleTimeString("bn-BD", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>

                                  {room.book && (
                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold truncate mb-0.5">
                                      📖 {room.book.title}
                                    </p>
                                  )}

                                  <p
                                    className={`text-[11px] truncate ${
                                      isUnread ? "font-bold text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"
                                    }`}
                                  >
                                    {lastMsg?.content || "নতুন কনভার্সেশন..."}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Footer */}
                      <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center">
                        <Link
                          href="/chat"
                          onClick={() => setChatDropdownOpen(false)}
                          className="w-full block py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                          সব মেসেজ দেখুন (ইনবক্স) →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div ref={userDropdownRef} className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                      {user.name?.slice(0, 1) || "U"}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden lg:inline max-w-[90px] truncate">
                      {user.name}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                          📍 {user.locationName || "ক্যাম্পাস"}
                        </p>
                      </div>

                      <Link
                        href="/my-books"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-800 dark:hover:text-emerald-400"
                      >
                        <Library className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>আমার বইসমূহ (Inventory)</span>
                      </Link>

                      <Link
                        href="/wallet"
                        className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-800 dark:hover:text-emerald-400"
                      >
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-amber-500" />
                          <span>ওয়ালেট ও রেফারেল</span>
                        </div>
                        <span className="text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded">
                          {user.points} pt
                        </span>
                      </Link>

                      {user.isSuperAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800"
                        >
                          <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          <span>অ্যাডমিন ড্যাশবোর্ড</span>
                        </Link>
                      )}

                      <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>লগআউট</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  লগইন
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  সাইন আপ
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 dark:border-slate-800 py-3 space-y-1">
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>এক্সপ্লোর ও ম্যাপ</span>
            </Link>
            <Link
              href="/requests"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800"
            >
              <Search className="w-4 h-4 text-emerald-600" />
              <span>বইয়ের খোঁজ চাই</span>
            </Link>
            <Link
              href="/wallet"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" />
                <span>১০ বন্ধুতে ৫০৳ (রেফারেল)</span>
              </div>
              {user && (
                <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                  {user.points} pts
                </span>
              )}
            </Link>
            {user && (
              <>
                <Link
                  href="/my-books"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800"
                >
                  <Library className="w-4 h-4 text-emerald-600" />
                  <span>আমার বইসমূহ</span>
                </Link>
                <Link
                  href="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>ইনবক্স ও চ্যাট</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-black bg-rose-600 text-white rounded-full">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            {user?.isSuperAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-lg"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>সুপার অ্যাডমিন ড্যাশবোর্ড</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
