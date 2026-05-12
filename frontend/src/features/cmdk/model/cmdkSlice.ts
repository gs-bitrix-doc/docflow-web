import { createSlice } from '@reduxjs/toolkit'

interface CmdkState {
  open: boolean
}

const initialState: CmdkState = {
  open: false,
}

export const cmdkSlice = createSlice({
  name: 'cmdk',
  initialState,
  reducers: {
    open(state) {
      state.open = true
    },
    close(state) {
      state.open = false
    },
    toggle(state) {
      state.open = !state.open
    },
  },
  selectors: {
    selectOpen: (state) => state.open,
  },
})

export const { open, close, toggle } = cmdkSlice.actions
export const { selectOpen: selectCmdkOpen } = cmdkSlice.selectors
