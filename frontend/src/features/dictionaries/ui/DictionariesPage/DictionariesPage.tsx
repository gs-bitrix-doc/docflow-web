import { useEffect } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { DEFAULT_DICTIONARY_TYPE, isDictionaryType } from '../../model/types'
import { DictionarySidebar } from '../DictionarySidebar/DictionarySidebar'
import { DictionaryView } from '../DictionaryView/DictionaryView'
import { MvpBanner } from '../MvpBanner/MvpBanner'
import styles from './DictionariesPage.module.css'

export function DictionariesPage() {
  const { type } = useParams<{ type: string }>()
  const navigate = useNavigate()

  const validType = isDictionaryType(type) ? type : null

  useEffect(() => {
    if (!validType) {
      void navigate(`/dictionaries/${DEFAULT_DICTIONARY_TYPE}`, { replace: true })
    }
  }, [validType, navigate])

  if (!validType) {
    return <Navigate to={`/dictionaries/${DEFAULT_DICTIONARY_TYPE}`} replace />
  }

  return (
    <div className={styles.page}>
      <MvpBanner />
      <div className={styles.layout}>
        <DictionarySidebar activeType={validType} />
        <main className={styles.main}>
          <DictionaryView dictType={validType} />
        </main>
      </div>
    </div>
  )
}
