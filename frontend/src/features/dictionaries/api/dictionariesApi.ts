import { baseApi } from '@/shared/api/baseApi'
import type { DictionaryResponse, DictionarySummaryResponse, DictionaryType } from '../model/types'

export const dictionariesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDictionariesSummary: builder.query<DictionarySummaryResponse, void>({
      query: () => ({
        url: '/dictionaries',
      }),
      providesTags: ['Dictionary'],
    }),
    getDictionary: builder.query<DictionaryResponse, DictionaryType>({
      query: (dictType) => ({
        url: `/dictionaries/${dictType}`,
      }),
      providesTags: (_result, _error, dictType) => [{ type: 'Dictionary', id: dictType }],
    }),
  }),
})

export const { useGetDictionariesSummaryQuery, useGetDictionaryQuery } = dictionariesApi
