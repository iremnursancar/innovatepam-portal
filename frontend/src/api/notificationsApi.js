import apiClient from './apiClient'

/**
 * Fetch notification counts for the current user (legacy bell badge).
 * @returns {Promise<{ pendingIdeas: number, newActivities: number }>}
 */
export async function getNotificationCount() {
  const { data } = await apiClient.get('/notifications/count')
  return data
}

/**
 * Fetch the current user's notifications.
 * @returns {Promise<{ notifications: Array, unreadCount: number }>}
 */
export async function getNotifications() {
  const { data } = await apiClient.get('/notifications')
  return data
}

/**
 * Mark a single notification as read.
 * @param {number} id
 */
export async function markOneRead(id) {
  await apiClient.patch(`/notifications/${id}/read`)
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllRead() {
  await apiClient.patch('/notifications/read-all')
}
