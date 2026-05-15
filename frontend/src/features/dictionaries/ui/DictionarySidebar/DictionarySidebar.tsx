import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { useGetDictionariesSummaryQuery } from '../../api/dictionariesApi'
import { DICTIONARY_TYPES, type DictionaryType } from '../../model/types'
import styles from './DictionarySidebar.module.css'

function CountBadge({ count }: { count: number }) {
  return <span className={styles.count}>{count}</span>
}

function SidebarSkeleton() {
  return (
    <div className={styles.skeletonList}>
      {DICTIONARY_TYPES.map((type) => (
        <div key={type} className={styles.skeletonItem} />
      ))}
    </div>
  )
}

interface DictionarySidebarProps {
  activeType: DictionaryType
}

export function DictionarySidebar({ activeType }: DictionarySidebarProps) {
  const { t } = useTranslation('dictionaries')
  const { data, isLoading } = useGetDictionariesSummaryQuery()

  const countByType = Object.fromEntries(
    (data?.items ?? []).map((item) => [item.dict_type, item.entry_count]),
  ) as Partial<Record<DictionaryType, number>>

  return (
    <nav className={styles.sidebar} aria-label={t('title')}>
      <div className={styles.sidebarHeader}>{t('title')}</div>

      {isLoading ? (
        <SidebarSkeleton />
      ) : (
        <ul className={styles.list}>
          {DICTIONARY_TYPES.map((type) => {
            const count = countByType[type] ?? 0
            const isActive = type === activeType

            return (
              <li key={type}>
                <NavLink
                  to={`/dictionaries/${type}`}
                  className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={styles.itemLabel}>{t(`types.${type}`)}</span>
                  <CountBadge count={count} />
                </NavLink>
              </li>
            )
          })}
        </ul>
      )}
    </nav>
  )
}
