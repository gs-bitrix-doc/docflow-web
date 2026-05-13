import { baseApi } from './baseApi'

export interface AnalyticsStatsResponse {
  total: number
  running: number
  done: number
  failed: number
  published: number
  avg_duration_seconds: number | null
  success_rate: number | null
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
