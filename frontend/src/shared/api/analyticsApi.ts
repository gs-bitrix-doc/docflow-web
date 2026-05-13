import { baseApi } from './baseApi'

export interface AnalyticsStatsResponse {
  total_tasks: number
  success_rate: number
  avg_duration_seconds: number
  tasks_by_status: Record<string, number>
  tasks_per_day: Array<{ date: string; count: number }>
  top_errors: Array<{ error_type: string; count: number }>
}

function todayIso() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnalyticsStats: builder.query<AnalyticsStatsResponse, void>({
      query: () => ({
        url: '/analytics',
        params: { from: todayIso() },
      }),
      providesTags: ['Analytics'],
    }),
  }),
})

export const { useGetAnalyticsStatsQuery } = analyticsApi
