'use client';

import React, { useState, useEffect } from 'react';
import { ContactForm } from '@/components/ContactForm';

interface MessageNotificationProps {
  clinicId: string;
}

/**
 * Component to show new messages notification
 * يعرض إشعار برسائل جديدة في لوحة التحكم
 */
export const MessageNotification: React.FC<MessageNotificationProps> = ({
  clinicId,
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMessages, setShowMessages] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?clinicId=${clinicId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
          setUnreadCount(data.filter((m: any) => !m.read).length);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();

    // Refresh messages every 30 seconds
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [clinicId]);

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, read: true } : m
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  return (
    <>
      <ContactForm clinicId={clinicId} />

      {/* Messages Button - top right */}
      {unreadCount > 0 && (
        <button
          onClick={() => setShowMessages(!showMessages)}
          className="fixed top-8 right-8 z-40 bg-red-600 hover:bg-red-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition duration-300 relative group"
          title="رسائل جديدة"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {unreadCount}
          </span>
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 bg-neutral-800 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
            {unreadCount} رسائل جديدة
          </div>
        </button>
      )}

      {/* Messages Panel */}
      {showMessages && (
        <div className="fixed top-24 right-8 z-40 bg-white rounded-2xl shadow-2xl w-96 max-h-96 overflow-hidden animation-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 flex items-center justify-between">
            <h3 className="font-bold text-lg">الرسائل ({messages.length})</h3>
            <button
              onClick={() => setShowMessages(false)}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Messages List */}
          <div className="overflow-y-auto max-h-80">
            {messages.length === 0 ? (
              <div className="p-6 text-center text-neutral-500">
                <p className="text-sm">لا توجد رسائل</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition ${
                    !message.read ? 'bg-primary-50' : ''
                  }`}
                  onClick={() => markAsRead(message.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900 truncate">
                        {message.subject}
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">
                        من: {message.name}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                        {message.message}
                      </p>
                    </div>
                    {!message.read && (
                      <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};