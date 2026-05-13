import { useEffect, useRef, useState } from 'react'

export function usePollNewTasks(taskIds: string[], resetKey: string) {
  const previousIdsRef = useRef<string[] | null>(null)
  const prevResetKeyRef = useRef(resetKey)
  const [newTasksCount, setNewTasksCount] = useState(0)

  useEffect(() => {
    // Filter changed — reset baseline to current IDs, clear counter
    if (prevResetKeyRef.current !== resetKey) {
      prevResetKeyRef.current = resetKey
      previousIdsRef.current = taskIds
      setNewTasksCount(0)
      return
    }

    // First render — store initial IDs without counting
    if (previousIdsRef.current === null) {
      previousIdsRef.current = taskIds
      return
    }

    const previousIds = new Set(previousIdsRef.current)
    const addedCount = taskIds.filter((id) => !previousIds.has(id)).length
    if (addedCount > 0) {
      setNewTasksCount((n) => n + addedCount)
    }
    previousIdsRef.current = taskIds
  }, [taskIds, resetKey])

  return {
    newTasksCount,
    clearNewTasks: () => setNewTasksCount(0),
  }
}
