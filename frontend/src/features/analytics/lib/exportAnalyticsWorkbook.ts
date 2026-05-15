import { formatDate } from '@/shared/lib/date'
import {
  ANALYTICS_TASK_STATUSES,
  type AnalyticsDailyBucket,
  type AnalyticsResponse,
  type AnalyticsTaskStatus,
  type AnalyticsTopError,
} from '../model/types'

interface AnalyticsExportLabels {
  workbookTitle: string
  generatedAt: string
  project: string
  period: string
  summarySheet: string
  dailySheet: string
  errorsSheet: string
  metricsSection: string
  statusesSection: string
  totalTasks: string
  successRate: string
  avgDuration: string
  publishedCount: string
  totalErrors: string
  count: string
  share: string
  noErrors: string
  dailyDate: string
  dailyTotal: string
  dailySuccessful: string
  dailySuccessRate: string
  errorType: string
  statusLabels: Record<AnalyticsTaskStatus, string>
}

interface ExportAnalyticsWorkbookOptions {
  analytics: AnalyticsResponse
  labels: AnalyticsExportLabels
  projectName: string
  periodLabel: string
  fileName: string
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return '—'
  }

  return `${Math.round(value * 10) / 10}%`
}

function formatDuration(value: number) {
  const totalSeconds = Math.max(0, Math.round(value))

  if (totalSeconds < 60) {
    return `${totalSeconds} с`
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return seconds > 0 ? `${minutes} м ${seconds} с` : `${minutes} м`
}

function formatShare(value: number, total: number) {
  if (total <= 0) {
    return '—'
  }

  return formatPercent((value / total) * 100)
}

function buildSummaryRows(
  analytics: AnalyticsResponse,
  labels: AnalyticsExportLabels,
  projectName: string,
  periodLabel: string,
) {
  const generatedAtLabel = new Date().toLocaleString('ru-RU')

  return [
    [labels.workbookTitle],
    [],
    [labels.generatedAt, generatedAtLabel],
    [labels.project, projectName],
    [labels.period, periodLabel],
    [],
    [labels.metricsSection],
    [labels.totalTasks, analytics.total_tasks],
    [labels.successRate, formatPercent(analytics.success_rate * 100)],
    [labels.avgDuration, formatDuration(analytics.avg_duration_seconds)],
    [labels.publishedCount, analytics.published_count],
    [labels.totalErrors, analytics.top_errors.reduce((sum, item) => sum + item.count, 0)],
    [],
    [labels.statusesSection],
    ['Статус', labels.count, labels.share],
    ...ANALYTICS_TASK_STATUSES.map((status) => [
      labels.statusLabels[status],
      analytics.tasks_by_status[status] ?? 0,
      formatShare(analytics.tasks_by_status[status] ?? 0, analytics.total_tasks),
    ]),
  ]
}

function buildDailyRows(tasksPerDay: AnalyticsDailyBucket[], labels: AnalyticsExportLabels) {
  return tasksPerDay.map((item) => {
    const total = ANALYTICS_TASK_STATUSES.reduce((sum, status) => sum + item[status], 0)
    const successful = item.done + item.published
    const terminal = successful + item.failed

    return {
      [labels.dailyDate]: formatDate(item.date),
      [labels.statusLabels.queued]: item.queued,
      [labels.statusLabels.running]: item.running,
      [labels.statusLabels.done]: item.done,
      [labels.statusLabels.failed]: item.failed,
      [labels.statusLabels.published]: item.published,
      [labels.statusLabels.conflict]: item.conflict,
      [labels.dailySuccessful]: successful,
      [labels.dailyTotal]: total,
      [labels.dailySuccessRate]: terminal > 0 ? formatPercent((successful / terminal) * 100) : '—',
    }
  })
}

function buildErrorRows(topErrors: AnalyticsTopError[], labels: AnalyticsExportLabels) {
  const totalErrors = topErrors.reduce((sum, item) => sum + item.count, 0)

  if (topErrors.length === 0) {
    return [{ [labels.errorType]: labels.noErrors, [labels.count]: 0, [labels.share]: '—' }]
  }

  return topErrors.map((item) => ({
    [labels.errorType]: item.error_type,
    [labels.count]: item.count,
    [labels.share]: formatShare(item.count, totalErrors),
  }))
}

export async function exportAnalyticsWorkbook({
  analytics,
  labels,
  projectName,
  periodLabel,
  fileName,
}: ExportAnalyticsWorkbookOptions) {
  const XLSX = await import('xlsx/xlsx.mjs')
  const workbook = XLSX.utils.book_new()

  const summarySheet = XLSX.utils.aoa_to_sheet(
    buildSummaryRows(analytics, labels, projectName, periodLabel),
  )
  summarySheet['!cols'] = [{ wch: 28 }, { wch: 26 }, { wch: 16 }]

  const dailySheet = XLSX.utils.json_to_sheet(buildDailyRows(analytics.tasks_per_day, labels))
  dailySheet['!cols'] = [
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
  ]

  const errorsSheet = XLSX.utils.json_to_sheet(buildErrorRows(analytics.top_errors, labels))
  errorsSheet['!cols'] = [{ wch: 42 }, { wch: 12 }, { wch: 14 }]

  XLSX.utils.book_append_sheet(workbook, summarySheet, labels.summarySheet)
  XLSX.utils.book_append_sheet(workbook, dailySheet, labels.dailySheet)
  XLSX.utils.book_append_sheet(workbook, errorsSheet, labels.errorsSheet)

  XLSX.writeFileXLSX(workbook, fileName)
}
