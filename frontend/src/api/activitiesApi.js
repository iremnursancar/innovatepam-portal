import apiClient from './apiClient'

/**
 * Fetch the 20 most recent activity events.
 * @returns {Promise<Array<{ id: number, type: string, user_email: string, idea_title: string, timestamp: string }>>}
 */
export async function listActivities() {
  const { data } = await apiClient.get('/activities')
  return data.activities
}
