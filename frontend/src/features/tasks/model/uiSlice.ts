import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { TaskListFilters, TaskStatus } from './types'

interface UIState {
  selectedTaskIds: string[]
  batchMode: boolean
  filters: TaskListFilters
}

const initialState: UIState = {
  selectedTaskIds: [],
  batchMode: false,
  filters: { status: null, projectId: null },
}

export const uiSlice = createSlice({
  name: 'tasksUI',
  initialState,
  reducers: {
    toggleTask(state, action: PayloadAction<string>) {
      const id = action.payload
      const idx = state.selectedTaskIds.indexOf(id)
      if (idx === -1) {
        state.selectedTaskIds.push(id)
      } else {
        state.selectedTaskIds.splice(idx, 1)
      }
      state.batchMode = state.selectedTaskIds.length > 0
    },
    clearSelection(state) {
      state.selectedTaskIds = []
      state.batchMode = false
    },
    setStatusFilter(state, action: PayloadAction<TaskStatus | null>) {
      state.filters.status = action.payload
    },
    setProjectFilter(state, action: PayloadAction<string | null>) {
      state.filters.projectId = action.payload
    },
  },
})

export const { toggleTask, clearSelection, setStatusFilter, setProjectFilter } = uiSlice.actions
