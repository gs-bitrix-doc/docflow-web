import { describe, expect, it } from 'vitest'
import { close, cmdkSlice, open, toggle } from '@/features/cmdk/model/cmdkSlice'

describe('cmdkSlice', () => {
  it('starts closed', () => {
    const state = cmdkSlice.reducer(undefined, { type: '@@INIT' })
    expect(state.open).toBe(false)
  })

  it('opens palette', () => {
    const next = cmdkSlice.reducer({ open: false }, open())
    expect(next.open).toBe(true)
  })

  it('closes palette', () => {
    const next = cmdkSlice.reducer({ open: true }, close())
    expect(next.open).toBe(false)
  })

  it('toggles palette state', () => {
    const opened = cmdkSlice.reducer({ open: false }, toggle())
    const closed = cmdkSlice.reducer(opened, toggle())

    expect(opened.open).toBe(true)
    expect(closed.open).toBe(false)
  })
})
