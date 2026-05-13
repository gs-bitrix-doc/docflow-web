import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { TaskStatus } from '../model/types'

const VALID_STATUSES: TaskStatus[] = [
  'queued',
  'running',
  'done',
  'failed',
  'published',
  'conflict',
]

export function useTaskFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => {
    const statusParam = searchParams.get('status')
    const status = VALID_STATUSES.includes(statusParam as TaskStatus)
      ? (statusParam as TaskStatus)
      : null

    return {
      status,
      projectId: searchParams.get('project_id'),
      search: searchParams.get('search') ?? '',
    }
  }, [searchParams])

  const setFilters = useCallback(
    (next: { status?: TaskStatus | null; projectId?: string | null; search?: string }) => {
      const params = new URLSearchParams(searchParams)

      if ('status' in next) {
        if (next.status) {
          params.set('status', next.status)
        } else {
          params.delete('status')
        }
      }

      if ('projectId' in next) {
        if (next.projectId) {
          params.set('project_id', next.projectId)
        } else {
          params.delete('project_id')
        }
      }

      if ('search' in next) {
        const value = next.search?.trim() ?? ''
        if (value) {
          params.set('search', value)
        } else {
          params.delete('search')
        }
      }

      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  return {
    filters,
    setFilters,
    resetFilters,
  }
}
