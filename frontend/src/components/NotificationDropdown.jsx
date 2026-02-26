import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
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
    case 'new_submission': return { icon: '💡', color: 'text-cyan-400' }
    case 'under_review':   return { icon: '👁️', color: 'text-amber-400' }
    case 'accepted':       return { icon: '✅', color: 'text-emerald-400' }
    case 'rejected':       return { icon: '❌', color: 'text-rose-400' }
    default:               return { icon: '🔔', color: 'text-slate-400' }
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
        className="relative text-slate-400 hover:text-cyan-400 transition-colors"
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
        <div className="absolute right-0 top-8 z-50 w-80 rounded-lg border border-navy-border bg-[#0d2137] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-navy-border">
            <span className="text-sm font-semibold text-slate-200">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <ul className="max-h-80 overflow-y-auto divide-y divide-navy-border/50">
            {loading && (
              <li className="px-4 py-6 text-center text-sm text-slate-500">Loading…</li>
            )}
            {!loading && recent.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet.</li>
            )}
            {!loading && recent.map(notif => {
              const { icon, color } = typeStyle(notif.type)
              return (
                <li key={notif.id}>
                  <button
                    onClick={() => handleClickNotification(notif)}
                    className={`w-full text-left px-4 py-3 hover:bg-navy-card/60 transition-colors flex items-start gap-3 ${notif.is_read ? 'opacity-60' : ''}`}
                  >
                    {/* Unread dot */}
                    <span className="mt-0.5 shrink-0">
                      {!notif.is_read && (
                        <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 mr-1" />
                      )}
                    </span>
                    <span className="text-lg leading-none shrink-0">{icon}</span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-sm font-medium ${color} truncate`}>
                        {notif.message}
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">
                        {relativeTime(notif.created_at)}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {/* Footer: pending ideas shortcut (admin only) */}
          {isAdmin && (
            <div className="px-4 py-3 border-t border-navy-border">
              <button
                onClick={() => { setOpen(false); navigate('/ideas?filter=pending') }}
                className="w-full rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all text-center"
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
