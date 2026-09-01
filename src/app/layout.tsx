import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ChatWidgetProvider } from "@/context/ChatWidgetContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingChatWidget from "@/components/chat/FloatingChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BoiBinimoy - হাইপার-লোকাল বই শেয়ারিং ও সোয়াপিং প্ল্যাটফর্ম",
  description:
    "আপনার আশেপাশের শিক্ষার্থীদের সাথে বই বিনিময়, বিক্রি এবং গিভঅ্যাওয়ে করুন। ১০ বন্ধুকে রেফার করে পান ৫০ টাকা!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          <AuthProvider>
            <ChatWidgetProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <FloatingChatWidget />
            </ChatWidgetProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
