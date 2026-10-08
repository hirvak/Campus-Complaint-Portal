import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Button from '../components/Button';
import { Bell, CheckCheck, AlertCircle } from 'lucide-react';

export function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadNotifications = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await api.notifications.getAll();
      setNotifications(data);
      window.dispatchEvent(new CustomEvent('unread-notifications-updated'));
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    setErrorMessage('');
    try {
      await api.notifications.markAllAsRead();
      await loadNotifications();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to mark notifications as read.');
      window.dispatchEvent(new CustomEvent('unread-notifications-updated'));
    }
  };

  const handleMarkRead = async (id) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.is_read) return;

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setErrorMessage('');

    try {
      await api.notifications.markAsRead(id);
      window.dispatchEvent(new CustomEvent('unread-notifications-updated'));
    } catch (err) {
      // Revert optimistic update on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
      );
      setErrorMessage(err.message || 'Failed to mark notification as read.');
      window.dispatchEvent(new CustomEvent('unread-notifications-updated'));
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#F5F0E7] dark:bg-[#111827] py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-150">
      <div className="max-w-4xl mx-auto space-y-6 text-left">
        
        {/* HEADER SURFACE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 text-left flex items-center justify-between shadow-2xs">
          <div>
            <h1 className="text-2xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC]">
              NOTIFICATIONS
            </h1>
            <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] mt-0.5">
              Real-time system updates regarding complaint status changes, assignments, and resolution activity
            </p>
          </div>

          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="w-4 h-4 mr-1.5 text-[#B51232] dark:text-[#C51F3D]" />
              Mark All Read
            </Button>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-[#FDF2F4] dark:bg-[#D6455D]/15 border border-[#F8D7DA] dark:border-[#D6455D]/30 text-[#94102A] dark:text-[#D6455D] p-4 rounded-[8px] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#B51232] dark:text-[#D6455D]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MAIN NOTIFICATION WHITE SURFACE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 text-left shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#DED8CC] dark:border-[#344155] pb-3">
            <h2 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#10213A] dark:text-[#F8FAFC] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" />
              ACTIVITY FEED ({notifications.length})
            </h2>
            {unreadCount > 0 && (
              <span className="text-[11px] font-bold text-[#B51232] dark:text-[#C51F3D] bg-[#FDF2F4] dark:bg-[#C51F3D]/15 border border-[#F8D7DA] dark:border-[#C51F3D]/30 px-2 py-0.5 rounded-[4px]">
                {unreadCount} Unread
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-semibold text-[#60708A] dark:text-[#AEB9C9]">
              Loading notification feed...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Bell className="w-8 h-8 text-[#60708A] dark:text-[#7F8CA1] mx-auto opacity-40" />
              <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] font-semibold">No notifications available.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DED8CC] dark:before:bg-[#344155]">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  className={`relative cursor-pointer transition-colors p-3.5 rounded-[6px] border ${
                    n.is_read ? 'border-transparent opacity-80 hover:bg-[#FAF7F0] dark:hover:bg-[#202B3D]' : 'bg-[#FDF2F4]/40 dark:bg-[#C51F3D]/10 border-[#F8D7DA] dark:border-[#C51F3D]/30 font-medium'
                  }`}
                >
                  <span
                    className={`absolute -left-[1.625rem] top-4 w-2.5 h-2.5 rounded-full ${
                      n.is_read ? 'bg-[#60708A] dark:bg-[#7F8CA1] ring-4 ring-white dark:ring-[#182235]' : 'bg-[#B51232] dark:bg-[#C51F3D] ring-4 ring-white dark:ring-[#182235]'
                    }`}
                  />
                  <div>
                    <p className="text-xs font-bold text-[#10213A] dark:text-[#F8FAFC]">{n.title}</p>
                    <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] mt-0.5 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-[#60708A] dark:text-[#7F8CA1] mt-1 inline-block">
                      {n.created_at ? new Date(n.created_at).toLocaleString() : 'Just now'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Notifications;
