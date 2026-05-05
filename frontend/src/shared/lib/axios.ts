import axios from 'axios'
import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import type { AxiosRequestConfig, AxiosError } from 'axios'

export const axiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

export const axiosBaseQuery =
  (): BaseQueryFn<AxiosRequestConfig, unknown, unknown> =>
  async ({ url = '', method = 'GET', data, params }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await axiosInstance({ url, method, data, params })
      return { data: result.data as unknown }
    } catch (err) {
      const error = err as AxiosError
      return {
        error: {
          status: error.response?.status,
          data: error.response?.data,
        },
      }
    }
  }
