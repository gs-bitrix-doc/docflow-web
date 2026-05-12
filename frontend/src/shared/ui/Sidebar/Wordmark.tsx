import { Link } from 'react-router-dom'
import styles from './Sidebar.module.css'

export function Wordmark() {
  return (
    <Link className={styles.wordmark} to="/tasks" aria-label="DocFlow">
      <span className={styles.wordmarkGlyph} aria-hidden>
        <span />
        <span />
        <span />
      </span>
      <span>DocFlow</span>
    </Link>
  )
}
