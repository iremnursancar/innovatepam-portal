import apiClient from './apiClient'

/**
 * Fetch aggregated idea statistics (admin only).
 * @returns {Promise<{
 *   totalIdeas: number,
 *   pendingReview: number,
 *   acceptedIdeas: number,
 *   rejectedIdeas: number,
 *   acceptanceRate: number,
 *   categoryCounts: Record<string, number>,
 *   mostPopularCategory: string | null
 * }>}
 */
export async function fetchStats() {
  const { data } = await apiClient.get('/stats')
  return data.stats
}
