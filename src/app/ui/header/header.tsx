import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { defaultBookFilters } from '@modules/books/model'
import { useLogoutMutation, useSessionQuery } from '@shared/api/auth'

import { getHeaderMobileNavigation, headerNavigation } from './lib'

import LogoMark from '@shared/assets/icons/Лого рисунок.svg?react'
import LogoText from '@shared/assets/icons/Лого шрифт.svg?react'
import UserIcon from '@shared/assets/icons/user.svg?react'

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
  const session = useSessionQuery()
  const logoutMutation = useLogoutMutation()
  const user = session.data
  const userLabel = getUserLabel(user?.username, user?.displayTag)
  const mobileNavigation = getHeaderMobileNavigation(Boolean(user))

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
      onSuccess: () => setMenuOpen(false),
    })
  }

  return (
    <header className={className} ref={rootRef}>
      <div className={styles.header}>
        <Link
          className={styles.headerLogo}
          to="/"
          search={defaultBookFilters}
          aria-label="Aeon Biblio"
        >
          <LogoMark className={styles.headerLogoMark} aria-hidden="true" />
          <LogoText className={styles.headerLogoText} aria-hidden="true" />
        </Link>

        <nav className={styles.headerNav} aria-label="Главная навигация">
          {headerNavigation.map(({ icon: Icon, id, label, search, to }) => (
            <Link
              className={styles.headerNavLink}
              to={to}
              search={search}
              key={id}
            >
              <Icon className={styles.headerNavIcon} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <div className={styles.headerAccount}>
          {user ? (
            <>
              <button
                className={styles.headerUserButton}
                type="button"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((value) => !value)}
              >
                <UserIcon
                  className={styles.headerUserIcon}
                  aria-hidden="true"
                />
                <span className={styles.headerUserName}>{userLabel}</span>
              </button>

              {menuOpen && (
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
              )}
            </>
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
          {mobileNavigation.map((item) => {
            const Icon = item.icon

            return 'search' in item ? (
              <Link
                className={styles.headerMobileTab}
                activeProps={{
                  className: `${styles.headerMobileTab} ${styles.headerMobileTabActive}`,
                }}
                to={item.to}
                search={item.search}
                key={item.id}
              >
                <Icon
                  className={styles.headerMobileTabIcon}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            ) : (
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
