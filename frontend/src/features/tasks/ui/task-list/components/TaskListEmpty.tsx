import { ArrowUpFromLine, List, Search, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import styles from './TaskListEmpty.module.css'

interface TaskListEmptyProps {
  userGithubLinked: boolean
  hasFilters: boolean
  hasProjects: boolean
  onResetFilters: () => void
  onOpenDialog: () => void
  onOpenUploadDialog: () => void
  onOpenRepositories: () => void
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.11.79-.25.79-.56v-2.16c-3.2.7-3.87-1.54-3.87-1.54-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.95.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.27-5.23-5.67 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.17a10.94 10.94 0 0 1 5.77 0c2.2-1.48 3.17-1.17 3.17-1.17.62 1.59.23 2.76.11 3.05.73.8 1.18 1.82 1.18 3.07 0 4.41-2.69 5.37-5.26 5.66.41.36.78 1.07.78 2.16v3.21c0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

export function TaskListEmpty({
  userGithubLinked,
  hasFilters,
  hasProjects,
  onResetFilters,
  onOpenDialog,
  onOpenUploadDialog,
  onOpenRepositories,
}: TaskListEmptyProps) {
  const { t } = useTranslation('tasks')

  if (!userGithubLinked) {
    return (
      <section className={styles.state}>
        <div className={styles.icon}>
          <GitHubMark />
        </div>
        <h2 className={styles.title}>{t('empty.no_github_title')}</h2>
        <p className={styles.description}>{t('empty.no_github_description')}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryButton} onClick={onOpenRepositories}>
            {t('empty.link_github')}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onOpenUploadDialog}>
            <Upload size={13} />
            {t('empty.upload_manual')}
          </button>
        </div>
        <p className={styles.subtext}>{t('empty.no_github_secondary')}</p>
      </section>
    )
  }

  if (hasFilters) {
    return (
      <section className={styles.state}>
        <div className={styles.icon}>
          <Search size={22} />
        </div>
        <h2 className={styles.title}>{t('empty.filtered_title')}</h2>
        <p className={styles.description}>{t('empty.filtered_description')}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={onResetFilters}>
            {t('empty.reset_filters')}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.state}>
      <div className={styles.icon}>
        <List size={22} />
      </div>
      <h2 className={styles.title}>
        {t(hasProjects ? 'empty.no_tasks_title' : 'empty.no_projects_title')}
      </h2>
      <p className={styles.description}>
        {t(hasProjects ? 'empty.no_tasks_description' : 'empty.no_projects_description')}
      </p>
      <div className={styles.actions}>
        {hasProjects ? (
          <button type="button" className={styles.primaryButton} onClick={onOpenDialog}>
            <ArrowUpFromLine size={13} />
            {t('trigger_translation')}
          </button>
        ) : null}
        <button type="button" className={styles.secondaryButton} onClick={onOpenRepositories}>
          {t('empty.open_repositories')}
        </button>
      </div>
    </section>
  )
}
