import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Lightbulb, Eye, CheckCircle, XCircle } from 'lucide-react'
import { getNotifications, markOneRead, markAllRead } from '../api/notificationsApi'
import { fetchStats } from '../api/statsApi'
import { useAuth } from '../context/AuthContext'

/** Returns a human-readable relative time string. */
function relativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60)   return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60)   return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)     return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/** Icon + colour per notification type. */
function typeStyle(type) {
  switch (type) {
    case 'new_submission': return { bg: '#EFF6FF', color: '#3B82F6', Icon: Lightbulb }
    case 'under_review':   return { bg: '#FEF3C7', color: '#F59E0B', Icon: Eye }
    case 'accepted':       return { bg: '#ECFDF5', color: '#10B981', Icon: CheckCircle }
    case 'rejected':       return { bg: '#FEF2F2', color: '#EF4444', Icon: XCircle }
    default:               return { bg: '#F3F4F6', color: '#9CA3AF', Icon: Bell }
  }
}

export default function NotificationDropdown() {
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const isAdmin    = user?.role === 'admin'
  const wrapperRef = useRef(null)

  const [open, setOpen]               = useState(false)
  const [notifications, setNotifs]    = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading]         = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications()
      setNotifs(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch {
      // non-critical
    }
    if (isAdmin) {
      try {
        const stats = await fetchStats()
        setPendingCount(stats.pendingReview ?? 0)
      } catch { /* non-critical */ }
    }
  }, [isAdmin])

  // Fetch on mount and every 60 s
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function handleMarkAllRead() {
    try {
      await markAllRead()
      setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })))
      setUnreadCount(0)
    } catch { /* non-critical */ }
  }

  async function handleClickNotification(notif) {
    if (!notif.is_read) {
      try {
        await markOneRead(notif.id)
        setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch { /* non-critical */ }
    }
    setOpen(false)
    navigate(`/ideas/${notif.idea_id}`)
  }

  const recent = notifications.slice(0, 10)

  return (
    <div ref={wrapperRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative text-gray-500 hover:text-[#7277F1] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-0.5 text-[10px] font-bold text-white leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-8 z-50 w-80 rounded-xl border border-[#E8E5FF] bg-white shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[#7277F1] hover:opacity-80 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {loading && (
              <li className="px-4 py-6 text-center text-sm text-gray-400">Loading…</li>
            )}
            {!loading && recent.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-gray-400">No notifications yet.</li>
            )}
            {!loading && recent.map(notif => {
              const { bg, color, Icon } = typeStyle(notif.type)
              return (
                <li key={notif.id}>
                  <button
                    onClick={() => handleClickNotification(notif)}
                    className={`w-full text-left px-4 py-3 hover:bg-[#FAFBFC] transition-colors flex items-center gap-3 ${notif.is_read ? 'opacity-50' : ''}`}
                  >
                    {/* Coloured icon container */}
                    <span
                      className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg"
                      style={{ background: bg }}
                    >
                      <Icon className="h-4 w-4" style={{ color }} strokeWidth={2} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-gray-800 truncate">
                        {notif.message}
                      </span>
                      <span className="block text-xs text-gray-400 mt-0.5">
                        {relativeTime(notif.created_at)}
                      </span>
                    </span>
                    {/* Unread dot */}
                    {!notif.is_read && (
                      <span className="shrink-0 h-2 w-2 rounded-full bg-[#7277F1]" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
          {/* Footer: pending ideas shortcut (admin only) */}
          {isAdmin && (
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => { setOpen(false); navigate('/ideas?filter=pending') }}
                className="w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all text-center"
              >
                📋 View {pendingCount} Pending Idea{pendingCount !== 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
