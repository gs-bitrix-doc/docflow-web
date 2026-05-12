import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Avatar } from '@/shared/ui/Avatar/Avatar'
import { clearUser, selectUser } from '@/features/auth/model/authSlice'
import { useLogoutMutation } from '@/features/auth/api/authApi'
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './Sidebar.module.css'

export function UserBlock() {
  const { t } = useTranslation(['common', 'nav'])
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector(selectUser)
  const [logout, { isLoading }] = useLogoutMutation()

  if (!user) {
    return null
  }

  const userLabel = user.display_name?.trim() || user.email
  const githubStatus = user.github_linked ? t('nav:github_connected') : t('nav:github_disconnected')

  async function handleLogout() {
    try {
      await logout().unwrap()
      dispatch(clearUser())
      void navigate('/login', { replace: true })
    } catch {
      // Error handling will be added with global notifications.
    }
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className={styles.userButton} type="button">
          <Avatar name={userLabel} size={26} />
          <span className={styles.userMeta}>
            <span className={styles.userName} title={userLabel}>
              {userLabel}
            </span>
            <span className={styles.userStatus}>
              <span
                className={user.github_linked ? styles.githubDot : styles.githubDotOff}
                aria-hidden
              />
              <span>{githubStatus}</span>
            </span>
          </span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          className={styles.dropdownContent}
          side="top"
          sideOffset={10}
        >
          <DropdownMenu.Item asChild>
            <Link className={styles.dropdownItem} to="/settings">
              {t('nav:settings')}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={styles.dropdownItem}
            disabled={isLoading}
            onSelect={() => void handleLogout()}
          >
            {t('common:logout')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
