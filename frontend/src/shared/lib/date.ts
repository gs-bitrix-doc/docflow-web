import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ru'

dayjs.extend(relativeTime)
dayjs.locale('ru')

export const formatRelative = (date: string) => dayjs(date).fromNow()

export const formatDateTime = (date: string) => dayjs(date).format('D MMM YYYY, HH:mm')

export const formatDate = (date: string) => dayjs(date).format('D MMM YYYY')
