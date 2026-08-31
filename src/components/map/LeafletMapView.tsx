"use client";

import React, { useEffect, useRef } from "react";
import { useChatWidget } from "@/context/ChatWidgetContext";

export interface MapBookItem {
  id: string;
  userId?: string;
  title: string;
  author: string;
  category: string;
  condition: string;
  dealType: string;
  price: number;
  images: string[];
  approxLocation?: string;
  mapLatitude?: number;
  mapLongitude?: number;
  distance?: number;
  user?: {
    id?: string;
    name: string;
    locationName?: string;
  };
}

interface LeafletMapViewProps {
  books: MapBookItem[];
  centerLat?: number;
  centerLon?: number;
  radiusKm?: number;
}

export default function LeafletMapView({
  books,
  centerLat = 23.734,
  centerLon = 90.392,
  radiusKm = 5,
}: LeafletMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { openChat } = useChatWidget();

  useEffect(() => {
    let isMounted = true;

    // Attach global popup chat trigger handler
    (window as any).triggerBoiChat = (
      bookId: string,
      sellerId: string,
      title: string,
      price: number,
      image: string,
      sellerName: string
    ) => {
      openChat({
        bookId,
        sellerId,
        bookTitle: title,
        bookPrice: Number(price),
        bookImage: image,
        sellerName,
      });
    };

    // Dynamically load Leaflet on client
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLon],
        zoom: radiusKm <= 3 ? 14 : radiusKm <= 5 ? 13 : 12,
        scrollWheelZoom: true,
      });

      mapInstanceRef.current = map;

      // OpenStreetMap Humanitarian Layer (Clean, 100% Free, Zero Watermark)
      L.tileLayer(
        "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }
      ).addTo(map);

      // Invalidate size once painted so tiles render seamlessly
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);

      // Search Radius Circle
      L.circle([centerLat, centerLon], {
        radius: radiusKm * 1000,
        color: "#059669",
        fillColor: "#10b981",
        fillOpacity: 0.12,
        weight: 2,
      }).addTo(map);

      // Center User Location Marker
      const centerIcon = L.divIcon({
        className: "custom-center-marker",
        html: `<div style="background-color:#ef4444; width:18px; height:18px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(239,68,68,0.8);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      L.marker([centerLat, centerLon], { icon: centerIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif; padding:2px; font-size:12px;">
            <strong style="color:#ef4444; display:block;">📍 আপনার অবস্থান</strong>
            <span>খোঁজার রেডিয়াস: ${radiusKm} কিমি</span>
          </div>
        `);

      // Add Book Pins
      books.forEach((book) => {
        const bLat = book.mapLatitude || centerLat;
        const bLon = book.mapLongitude || centerLon;

        let badgeBg = "#059669";
        let badgeText = `৳${book.price}`;
        if (book.dealType === "SWAP") {
          badgeBg = "#2563eb";
          badgeText = "বিনিময়";
        } else if (book.dealType === "GIVEAWAY") {
          badgeBg = "#d97706";
          badgeText = "ফ্রি";
        }

        const bookIcon = L.divIcon({
          className: "custom-book-marker",
          html: `<div style="background-color:${badgeBg}; color:white; padding:4px 8px; border-radius:9999px; font-weight:bold; font-size:11px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.35); display:flex; align-items:center; gap:4px; border:2px solid white; white-space:nowrap; cursor:pointer;">
            <span>📖</span> <span>${badgeText}</span>
          </div>`,
          iconSize: [60, 28],
          iconAnchor: [30, 14],
        });

        const fallbackImg = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80";
        const bookImg = book.images?.[0] || fallbackImg;

        const imgHtml = `<img src="${bookImg}" alt="${book.title}" style="width:100%; height:95px; object-fit:cover; border-radius:8px; margin-bottom:6px; background:#e2e8f0;" onerror="this.src='${fallbackImg}'" />`;

        const distHtml =
          book.distance !== undefined
            ? `<span style="font-size:10px; background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:bold;">📍 ${book.distance} কিমি</span>`
            : "";

        const sellerId = book.userId || book.user?.id || "";
        const sellerName = book.user?.name || "বিক্রেতা";
        const safeTitle = book.title.replace(/'/g, "\\'");
        const safeImg = bookImg.replace(/'/g, "\\'");

        const popupHtml = `
          <div style="max-width:210px; font-family:sans-serif; padding:2px;">
            ${imgHtml}
            <h4 style="font-weight:bold; font-size:12px; margin:0 0 3px 0; color:#0f172a; line-height:1.3;">${book.title}</h4>
            <p style="font-size:11px; color:#64748b; margin:0 0 6px 0;">${book.author}</p>
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
              <span style="font-weight:bold; color:${badgeBg}; font-size:12px;">${badgeText}</span>
              ${distHtml}
            </div>
            <p style="font-size:10px; color:#94a3b8; margin:0 0 8px 0;">📌 ${book.approxLocation || "ক্যাম্পাস এরিয়া"}</p>
            
            <button
              onclick="window.triggerBoiChat('${book.id}', '${sellerId}', '${safeTitle}', ${book.price}, '${safeImg}', '${sellerName}')"
              style="display:block; width:100%; text-align:center; padding:7px 10px; background:#059669; color:white; border:none; border-radius:8px; font-size:11px; font-weight:bold; cursor:pointer; margin-bottom:4px;"
            >
              💬 চ্যাট ও অফার বক্স ওপেন করুন
            </button>

            <a href="/books/${book.id}" style="display:block; text-align:center; font-size:10px; color:#059669; text-decoration:underline;">
              ফুল পেজ ভিউ
            </a>
          </div>
        `;

        L.marker([bLat, bLon], { icon: bookIcon })
          .addTo(map)
          .bindPopup(popupHtml);
      });
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [books, centerLat, centerLon, radiusKm, openChat]);

  return (
    <div className="w-full h-full min-h-[420px] rounded-3xl overflow-hidden shadow-md border border-slate-200 relative z-0 bg-slate-100">
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[420px]"
        style={{ zIndex: 1 }}
      />
    </div>
  );
}
