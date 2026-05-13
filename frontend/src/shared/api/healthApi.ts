import { baseApi } from './baseApi'

export interface HealthResponse {
  status: string
  pipeline_version: string
  last_webhook_at: string | null
}

export const healthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHealth: builder.query<HealthResponse, void>({
      query: () => ({
        url: '/health',
      }),
      providesTags: ['Health'],
    }),
  }),
})

export const { useGetHealthQuery } = healthApi
