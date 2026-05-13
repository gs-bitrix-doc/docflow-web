import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { useTaskFilters } from '@/features/tasks/hooks/useTaskFilters'

function makeWrapper(initialPath: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
  }
}

describe('useTaskFilters', () => {
  it('returns null status and empty search when URL has no params', () => {
    const { result } = renderHook(() => useTaskFilters(), {
      wrapper: makeWrapper('/'),
    })
    expect(result.current.filters.status).toBeNull()
    expect(result.current.filters.projectId).toBeNull()
    expect(result.current.filters.search).toBe('')
  })

  it('reads status from URL', () => {
    const { result } = renderHook(() => useTaskFilters(), {
      wrapper: makeWrapper('/?status=done'),
    })
    expect(result.current.filters.status).toBe('done')
  })

  it('ignores invalid status values', () => {
    const { result } = renderHook(() => useTaskFilters(), {
      wrapper: makeWrapper('/?status=invalid'),
    })
    expect(result.current.filters.status).toBeNull()
  })

  it('reads project_id from URL', () => {
    const { result } = renderHook(() => useTaskFilters(), {
      wrapper: makeWrapper('/?project_id=abc-123'),
    })
    expect(result.current.filters.projectId).toBe('abc-123')
  })

  it('reads search from URL', () => {
    const { result } = renderHook(() => useTaskFilters(), {
      wrapper: makeWrapper('/?search=hello'),
    })
    expect(result.current.filters.search).toBe('hello')
  })

  it('setFilters adds status param', () => {
    const { result } = renderHook(() => useTaskFilters(), {
      wrapper: makeWrapper('/'),
    })
    act(() => {
      result.current.setFilters({ status: 'failed' })
    })
    expect(result.current.filters.status).toBe('failed')
  })

  it('setFilters removes status param when null', () => {
    const { result } = renderHook(() => useTaskFilters(), {
      wrapper: makeWrapper('/?status=done'),
    })
    act(() => {
      result.current.setFilters({ status: null })
    })
    expect(result.current.filters.status).toBeNull()
  })

  it('resetFilters clears all params', () => {
    const { result } = renderHook(() => useTaskFilters(), {
      wrapper: makeWrapper('/?status=done&project_id=abc&search=test'),
    })
    act(() => {
      result.current.resetFilters()
    })
    expect(result.current.filters.status).toBeNull()
    expect(result.current.filters.projectId).toBeNull()
    expect(result.current.filters.search).toBe('')
  })
})
