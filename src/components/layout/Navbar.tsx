"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Poll for unread message count
  React.useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnread = async () => {
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

    fetchUnread();
    const timer = setInterval(fetchUnread, 4000);
    return () => clearInterval(timer);
  }, [user, pathname]);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-emerald-700 to-teal-800 bg-clip-text text-transparent">
                BoiBinimoy
              </span>
              <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded">
                বইবিনিময়
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/explore"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/explore")
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : "text-slate-600 hover:text-emerald-700 hover:bg-slate-50"
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              এক্সপ্লোর ও ম্যাপ
            </Link>

            <Link
              href="/requests"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/requests")
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : "text-slate-600 hover:text-emerald-700 hover:bg-slate-50"
              }`}
            >
              <Search className="w-4 h-4 text-emerald-600" />
              বইয়ের খোঁজ চাই
            </Link>

            <Link
              href="/wallet"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/wallet")
                  ? "bg-amber-50 text-amber-800 font-semibold"
                  : "text-slate-600 hover:text-amber-700 hover:bg-amber-50/50"
              }`}
            >
              <Gift className="w-4 h-4 text-amber-500 animate-pulse" />
              ১০ বন্ধুতে ৫০৳
              {user && (
                <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                  {user.points} pts
                </span>
              )}
            </Link>

            {user?.isSuperAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                  pathname.startsWith("/admin")
                    ? "bg-rose-100 text-rose-800"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                সুপার অ্যাডমিন
              </Link>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
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
                {/* Chat Inbox Icon with Unread Count Badge */}
                <Link
                  href="/chat"
                  className={`p-2.5 rounded-xl border transition-colors relative flex items-center justify-center ${
                    pathname.startsWith("/chat")
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  title="ইনবক্স ও চ্যাট"
                >
                  <MessageCircle className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                      {user.name?.slice(0, 1) || "U"}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 hidden lg:inline max-w-[90px] truncate">
                      {user.name}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        <p className="text-xs text-emerald-600 font-semibold mt-1">
                          📍 {user.locationName || "ক্যাম্পাস"}
                        </p>
                      </div>

                      <Link
                        href="/my-books"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        <Library className="w-4 h-4 text-emerald-600" />
                        আমার বইসমূহ (Inventory)
                      </Link>

                      <Link
                        href="/wallet"
                        className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-amber-500" />
                          ওয়ালেট ও রেফারেল
                        </div>
                        <span className="text-xs font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          {user.points} pt
                        </span>
                      </Link>

                      {user.isSuperAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-rose-700 font-semibold hover:bg-rose-50"
                        >
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                          সুপার অ্যাডমিন ড্যাশবোর্ড
                        </Link>
                      )}

                      <div className="border-t border-slate-100 mt-1">
                        <button
                          onClick={() => logout()}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          লগআউট
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                >
                  লগইন
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-block px-3.5 py-2 text-sm font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
                >
                  সাইন-আপ
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1">
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-emerald-50"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              এক্সপ্লোর ও ম্যাপ
            </Link>
            <Link
              href="/requests"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-emerald-50"
            >
              <Search className="w-4 h-4 text-emerald-600" />
              বইয়ের খোঁজ চাই
            </Link>
            <Link
              href="/wallet"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-amber-50"
            >
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" />
                ১০ বন্ধুতে ৫০৳ (রেফারেল)
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
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-emerald-50"
                >
                  <Library className="w-4 h-4 text-emerald-600" />
                  আমার বইসমূহ
                </Link>
                <Link
                  href="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-emerald-50"
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
                className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-rose-700 bg-rose-50 rounded-lg"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                সুপার অ্যাডমিন ড্যাশবোর্ড
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
