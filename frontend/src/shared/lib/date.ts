import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ru'

dayjs.extend(relativeTime)
dayjs.locale('ru')

export const formatRelative = (date: string) => dayjs(date).fromNow()

export const formatDateTime = (date: string) => dayjs(date).format('D MMM YYYY, HH:mm')

export const formatDate = (date: string) => dayjs(date).format('D MMM YYYY')

function formatMinutes(value: number, withSuffix: boolean) {
  return `${value} мин${withSuffix ? ' назад' : ''}`
}

function formatHours(value: number, withSuffix: boolean) {
  return `${value} ч${withSuffix ? ' назад' : ''}`
}

function isYesterday(target: Dayjs, now: Dayjs) {
  return now.startOf('day').diff(target.startOf('day'), 'day') === 1
}

export function formatRelativeShort(date: string, options?: { withSuffix?: boolean }) {
  const withSuffix = options?.withSuffix ?? false
  const target = dayjs(date)
  const now = dayjs()
  const diffSeconds = Math.max(0, now.diff(target, 'second'))

  if (diffSeconds < 45) {
    return withSuffix ? 'только что' : 'сейчас'
  }

  if (diffSeconds < 3600) {
    const minutes = Math.max(1, now.diff(target, 'minute'))
    return formatMinutes(minutes, withSuffix)
  }

  if (diffSeconds < 86400) {
    const hours = Math.max(1, now.diff(target, 'hour'))
    return formatHours(hours, withSuffix)
  }

  if (isYesterday(target, now)) {
    return 'вчера'
  }

  return target.format('D MMM')
}

export function formatCommitTimestamp(date: string) {
  const target = dayjs(date)
  const now = dayjs()
  const diffSeconds = Math.max(0, now.diff(target, 'second'))

  if (diffSeconds < 45) {
    return 'только что'
  }

  if (diffSeconds < 3600) {
    const minutes = Math.max(1, now.diff(target, 'minute'))
    return formatMinutes(minutes, true)
  }

  if (diffSeconds < 86400) {
    const hours = Math.max(1, now.diff(target, 'hour'))
    return formatHours(hours, true)
  }

  if (isYesterday(target, now)) {
    return `вчера, ${target.format('HH:mm')}`
  }

  return target.format('D MMM, HH:mm')
}
