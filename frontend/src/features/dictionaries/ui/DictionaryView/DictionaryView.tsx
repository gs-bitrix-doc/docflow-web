import { AlertCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/shared/lib/date'
import { Button } from '@/shared/ui/Button/Button'
import { EmptyState } from '@/shared/ui/EmptyState/EmptyState'
import { InlineAlert } from '@/shared/ui/InlineAlert/InlineAlert'
import { Input } from '@/shared/ui/Input/Input'
import { SectionCard } from '@/shared/ui/SectionCard/SectionCard'
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton'
import { useGetDictionaryQuery } from '../../api/dictionariesApi'
import type { DictionaryType } from '../../model/types'
import styles from './DictionaryView.module.css'

function TableSkeleton() {
  return (
    <div className={styles.skeletonRows}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <Skeleton width="30%" height={14} />
          <Skeleton width="40%" height={14} />
          <Skeleton width={40} height={14} />
          <Skeleton width={60} height={14} />
          <Skeleton width={70} height={14} />
        </div>
      ))}
    </div>
  )
}

interface DictionaryViewProps {
  dictType: DictionaryType
}

export function DictionaryView({ dictType }: DictionaryViewProps) {
  const { t } = useTranslation('dictionaries')
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch } = useGetDictionaryQuery(dictType, {
    refetchOnMountOrArgChange: true,
  })

  const filteredEntries = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    if (!q) return data.entries
    return data.entries.filter((e) => e.key.toLowerCase().includes(q))
  }, [data, search])

  const isPrompt = dictType === 'prompt'
  const promptEntry = isPrompt ? (data?.entries[0] ?? null) : null

  if (isLoading) {
    return (
      <div className={styles.view}>
        <Skeleton width={240} height={14} />
        <TableSkeleton />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className={styles.view}>
        <EmptyState
          icon={AlertCircle}
          title={t('error.title')}
          description={t('error.description')}
          actions={
            <Button variant="secondary" onClick={() => void refetch()}>
              {t('error.retry')}
            </Button>
          }
        />
      </div>
    )
  }

  if (isPrompt) {
    return (
      <div className={styles.view}>
        <SectionCard label={t('prompt_label')} description={t('prompt_description')}>
          <textarea
            className={styles.promptTextarea}
            readOnly
            value={promptEntry?.value ?? ''}
            rows={20}
          />
          {promptEntry ? (
            <div className={styles.promptMeta}>
              <span className={styles.sourcePill} data-source={promptEntry.source}>
                {t(`source.${promptEntry.source}`)}
              </span>
              {promptEntry.updated_by ? (
                <span className={styles.metaText}>{promptEntry.updated_by}</span>
              ) : null}
              {promptEntry.updated_at ? (
                <span className={styles.metaText}>{formatDate(promptEntry.updated_at)}</span>
              ) : null}
            </div>
          ) : null}
        </SectionCard>
      </div>
    )
  }

  return (
    <div className={styles.view}>
      <div className={styles.toolbar}>
        <Input
          placeholder={t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {search && filteredEntries.length === 0 ? (
        <InlineAlert className={styles.emptyAlert}>{t('empty_filtered')}</InlineAlert>
      ) : filteredEntries.length === 0 ? (
        <div className={styles.emptyWrap}>
          <EmptyState icon={AlertCircle} title={t('empty')} />
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>{t('columns.key')}</th>
                <th className={styles.th}>{t('columns.value')}</th>
                <th className={styles.th}>{t('columns.source')}</th>
                <th className={styles.th}>{t('columns.updated_by')}</th>
                <th className={styles.th}>{t('columns.updated_at')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.key} className={styles.tr}>
                  <td className={`${styles.td} ${styles.keyCell}`}>{entry.key}</td>
                  <td className={`${styles.td} ${styles.valueCell}`}>{entry.value}</td>
                  <td className={styles.td}>
                    <span className={styles.sourcePill} data-source={entry.source}>
                      {t(`source.${entry.source}`)}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.metaCell}`}>{entry.updated_by ?? '—'}</td>
                  <td className={`${styles.td} ${styles.metaCell}`}>
                    {entry.updated_at ? formatDate(entry.updated_at) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
