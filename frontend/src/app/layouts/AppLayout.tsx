import { Outlet } from 'react-router-dom'
import { useHotkeys } from 'react-hotkeys-hook'
import { open } from '@/features/cmdk/model/cmdkSlice'
import { Sidebar } from '@/shared/ui/Sidebar/Sidebar'
import { useAppDispatch } from '@/shared/store/hooks'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const dispatch = useAppDispatch()

  useHotkeys(
    'mod+k',
    (event) => {
      event.preventDefault()
      dispatch(open())
    },
    {
      preventDefault: true,
    },
    [dispatch],
  )

  return (
    <div className={styles.root}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
