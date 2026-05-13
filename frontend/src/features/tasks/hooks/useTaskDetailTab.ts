import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getAvailableTaskDetailTabs,
  getDefaultTaskDetailTab,
  isTaskDetailTab,
  type TaskDetailTab,
  type TaskStatus,
} from '../model/types'

export function useTaskDetailTab(status: TaskStatus) {
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = useMemo(() => {
    const tabParam = searchParams.get('tab')
    if (isTaskDetailTab(tabParam, status)) {
      return tabParam
    }

    return getDefaultTaskDetailTab(status)
  }, [searchParams, status])

  const setActiveTab = useCallback(
    (tab: TaskDetailTab) => {
      const resolvedTab = getAvailableTaskDetailTabs(status).includes(tab)
        ? tab
        : getDefaultTaskDetailTab(status)
      const params = new URLSearchParams(searchParams)
      params.set('tab', resolvedTab)
      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams, status],
  )

  return {
    activeTab,
    setActiveTab,
  }
}
