"use client";

import React, { createContext, useContext, useState } from "react";

export interface ActiveChatState {
  isOpen: boolean;
  isMinimized: boolean;
  roomId?: string | null;
  bookId?: string | null;
  sellerId?: string | null;
  bookTitle?: string | null;
  bookPrice?: number | null;
  bookImage?: string | null;
  sellerName?: string | null;
}

interface ChatWidgetContextType {
  chatState: ActiveChatState;
  openChat: (params: {
    bookId?: string;
    sellerId?: string;
    roomId?: string;
    bookTitle?: string;
    bookPrice?: number;
    bookImage?: string;
    sellerName?: string;
  }) => void;
  closeChat: () => void;
  toggleMinimize: () => void;
}

const defaultState: ActiveChatState = {
  isOpen: false,
  isMinimized: false,
  roomId: null,
  bookId: null,
  sellerId: null,
  bookTitle: null,
  bookPrice: null,
  bookImage: null,
  sellerName: null,
};

const ChatWidgetContext = createContext<ChatWidgetContextType>({
  chatState: defaultState,
  openChat: () => {},
  closeChat: () => {},
  toggleMinimize: () => {},
});

export function ChatWidgetProvider({ children }: { children: React.ReactNode }) {
  const [chatState, setChatState] = useState<ActiveChatState>(defaultState);

  const openChat = (params: {
    bookId?: string;
    sellerId?: string;
    roomId?: string;
    bookTitle?: string;
    bookPrice?: number;
    bookImage?: string;
    sellerName?: string;
  }) => {
    setChatState({
      isOpen: true,
      isMinimized: false,
      roomId: params.roomId || null,
      bookId: params.bookId || null,
      sellerId: params.sellerId || null,
      bookTitle: params.bookTitle || null,
      bookPrice: params.bookPrice !== undefined ? params.bookPrice : null,
      bookImage: params.bookImage || null,
      sellerName: params.sellerName || null,
    });
  };

  const closeChat = () => {
    setChatState(defaultState);
  };

  const toggleMinimize = () => {
    setChatState((prev) => ({ ...prev, isMinimized: !prev.isMinimized }));
  };

  return (
    <ChatWidgetContext.Provider
      value={{ chatState, openChat, closeChat, toggleMinimize }}
    >
      {children}
    </ChatWidgetContext.Provider>
  );
}

export const useChatWidget = () => useContext(ChatWidgetContext);
