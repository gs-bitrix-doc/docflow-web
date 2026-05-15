import dayjs from 'dayjs'
import { ANALYTICS_TASK_STATUSES } from '../model/types'
import type { AnalyticsDailyBucket, AnalyticsTasksPerDayPoint } from '../model/types'

export function buildTasksPerDaySeries(
  tasksPerDay: AnalyticsDailyBucket[],
): AnalyticsTasksPerDayPoint[] {
  return tasksPerDay.map((item) => {
    const total = ANALYTICS_TASK_STATUSES.reduce((sum, status) => sum + item[status], 0)

    return {
      ...item,
      label: dayjs(item.date).format('D MMM'),
      total,
    }
  })
}
