'use client';

import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';

const TYPE_LABELS: Record<string, string> = {
  NEW_BOOKING_REQUEST: 'Nouvelle réservation',
  BOOKING_CONFIRMATION: 'Réservation confirmée',
  BOOKING_CANCELLED: 'Réservation annulée',
  BOOKING_RESCHEDULED: 'Réservation modifiée',
  BOOKING_ACCEPTED: 'Réservation acceptée',
  BOOKING_REJECTED: 'Réservation refusée',
  BOOKING_REMINDER: 'Rappel RDV',
  PAYMENT_SUCCESS: 'Paiement reçu',
  PAYMENT_FAILED: 'Paiement échoué',
  REVIEW_REQUEST: 'Avis demandé',
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'à l\'instant';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: unreadData } = trpc.notification.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const { data: notifData, isLoading } = trpc.notification.getMyNotifications.useQuery(
    { limit: 20 },
    { enabled: open }
  );

  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate();
      utils.notification.getMyNotifications.invalidate();
    },
  });

  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate();
      utils.notification.getMyNotifications.invalidate();
    },
  });

  const deleteRead = trpc.notification.deleteAllRead.useMutation({
    onSuccess: () => {
      utils.notification.getMyNotifications.invalidate();
    },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = unreadData?.count ?? 0;
  const notifications = notifData?.items ?? [];

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-coffee-300 hover:bg-coffee-700 rounded-lg transition-colors"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-sand-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-sand-100">
            <h3 className="font-semibold text-coffee-800 text-sm">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead.mutate()}
                  disabled={markAllAsRead.isPending}
                  className="text-xs text-cream-700 hover:text-cream-800 font-medium"
                >
                  Tout lire
                </button>
              )}
              {notifications.some((n) => n.readAt) && (
                <button
                  onClick={() => deleteRead.mutate()}
                  disabled={deleteRead.isPending}
                  className="text-xs text-coffee-400 hover:text-coffee-600"
                >
                  Effacer lues
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-cream-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10 text-coffee-400 text-sm">
                Aucune notification
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.readAt;
                return (
                  <button
                    key={notif.id}
                    onClick={() => {
                      if (isUnread) markAsRead.mutate({ id: notif.id });
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-sand-50 hover:bg-sand-50 transition-colors ${
                      isUnread ? 'bg-cream-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {isUnread && (
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-cream-500 flex-shrink-0" />
                      )}
                      <div className={isUnread ? '' : 'ml-4'}>
                        <p className="text-xs font-semibold text-coffee-700 mb-0.5">
                          {TYPE_LABELS[notif.type] ?? notif.type}
                        </p>
                        <p className="text-xs text-coffee-600 leading-snug">{notif.body}</p>
                        <p className="text-xs text-coffee-400 mt-1">{timeAgo(notif.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
