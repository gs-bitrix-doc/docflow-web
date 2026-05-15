import dayjs from 'dayjs'
import type { AnalyticsDailyBucket, AnalyticsSuccessRatePoint } from '../model/types'

function roundPercent(value: number) {
  return Math.round(value * 10) / 10
}

export function buildSuccessRateSeries(
  tasksPerDay: AnalyticsDailyBucket[],
): AnalyticsSuccessRatePoint[] {
  return tasksPerDay.map((item) => {
    const successful = item.done + item.published
    const terminal = successful + item.failed

    return {
      date: item.date,
      label: dayjs(item.date).format('D MMM'),
      successRate: terminal > 0 ? roundPercent((successful / terminal) * 100) : null,
      successful,
      terminal,
    }
  })
}
