import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { useLogoutMutation, useSessionQuery } from '@shared/api/auth'
import {
  defaultAvatarSrc,
  getOnlineAwareAvatarSrc,
} from '@shared/lib/get-avatar-src'
import { useImageFallback } from '@shared/lib/use-image-fallback'
import { Spinner } from '@shared/ui/spinner/spinner'

import {
  getHeaderMobileNavigation,
  getHeaderNavigation,
  getMyBooksPath,
} from './lib'

import LogoMark from '@shared/assets/icons/Лого рисунок.svg?react'
import LogoText from '@shared/assets/icons/Лого шрифт.svg?react'

import styles from './header.module.scss'

type HeaderProps = {
  className?: string
}

function getUserLabel(username?: string, displayTag?: string | null) {
  if (!username) {
    return ''
  }

  return displayTag ? `${username} ${displayTag}` : username
}

export function Header({ className }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const rootRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const session = useSessionQuery()
  const logoutMutation = useLogoutMutation()
  const user = session.data
  const authLoading = session.isLoading && !user
  const userLabel = getUserLabel(user?.username, user?.displayTag)
  const avatar = useImageFallback(
    getOnlineAwareAvatarSrc(user?.avatarKey, user?.avatarUrl),
    defaultAvatarSrc,
  )
  const myBooksPath = getMyBooksPath(user?.role)
  const headerNavigation = getHeaderNavigation(myBooksPath)
  const mobileNavigation = getHeaderMobileNavigation(Boolean(user), myBooksPath)

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [menuOpen])

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setMenuOpen(false)
        void navigate({ to: '/', replace: true })
      },
    })
  }

  return (
    <header className={className} ref={rootRef}>
      <div className={styles.header}>
        <Link className={styles.headerLogo} to="/" aria-label="Aeon Biblio">
          <LogoMark className={styles.headerLogoMark} aria-hidden="true" />
          <LogoText className={styles.headerLogoText} aria-hidden="true" />
        </Link>

        <nav className={styles.headerNav} aria-label="Главная навигация">
          {headerNavigation.map(({ icon: Icon, id, label, to }) => (
            <Link className={styles.headerNavLink} to={to} key={id}>
              <Icon className={styles.headerNavIcon} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <div className={styles.headerAccount}>
          {authLoading ? (
            <Spinner
              className={styles.headerAccountSpinner}
              label="Проверяем сессию"
            />
          ) : user ? (
            <div className={styles.headerAccountPanel}>
              <button
                className={styles.headerUserButton}
                type="button"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((value) => !value)}
              >
                <img
                  className={styles.headerUserAvatar}
                  src={avatar.src}
                  alt=""
                  onError={avatar.onError}
                />
                <span className={styles.headerUserName}>{userLabel}</span>
              </button>

              {menuOpen ? (
                <div className={styles.headerMenu} role="menu">
                  <Link
                    className={styles.headerMenuItem}
                    to="/profile"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    Профиль
                  </Link>
                  <button
                    className={styles.headerMenuItem}
                    type="button"
                    role="menuitem"
                    disabled={logoutMutation.isPending}
                    onClick={handleLogout}
                  >
                    Выход
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link className={styles.headerLoginLink} to="/login">
              Войти
            </Link>
          )}
        </div>

        <nav
          className={styles.headerMobileTabs}
          aria-label="Мобильная навигация"
        >
          {authLoading
            ? null
            : mobileNavigation.map((item) => {
                const Icon = item.icon

                return (
                  <Link
                    className={styles.headerMobileTab}
                    activeProps={{
                      className: `${styles.headerMobileTab} ${styles.headerMobileTabActive}`,
                    }}
                    to={item.to}
                    key={item.id}
                  >
                    <Icon
                      className={styles.headerMobileTabIcon}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
        </nav>
      </div>
    </header>
  )
}
