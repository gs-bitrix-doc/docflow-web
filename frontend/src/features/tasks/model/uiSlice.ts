import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
interface UIState {
  selectedTaskIds: string[]
  batchMode: boolean
}

const initialState: UIState = {
  selectedTaskIds: [],
  batchMode: false,
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
    setSelectedTaskIds(state, action: PayloadAction<string[]>) {
      state.selectedTaskIds = action.payload
      state.batchMode = action.payload.length > 0
    },
    setBatchMode(state, action: PayloadAction<boolean>) {
      state.batchMode = action.payload
      if (!action.payload) {
        state.selectedTaskIds = []
      }
    },
    selectRange(state, action: PayloadAction<string[]>) {
      for (const id of action.payload) {
        if (!state.selectedTaskIds.includes(id)) {
          state.selectedTaskIds.push(id)
        }
      }
      state.batchMode = state.selectedTaskIds.length > 0
    },
  },
})

export const { toggleTask, clearSelection, setSelectedTaskIds, setBatchMode, selectRange } =
  uiSlice.actions
