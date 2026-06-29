import LibraryIcon from '@shared/assets/icons/icon (2).svg?react'
import BookIcon from '@shared/assets/icons/Vector (14).svg?react'
import UserIcon from '@shared/assets/icons/user.svg?react'

import type { ComponentType, SVGProps } from 'react'

type HeaderNavItem = {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  id: string
  label: string
  to: '/' | '/library' | '/author/books'
}

type HeaderMobileRouteItem = {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  id: string
  label: string
  to: '/login' | '/profile'
}

export type HeaderMobileNavItem = HeaderNavItem | HeaderMobileRouteItem

export function getHeaderNavigation(myBooksPath: '/library' | '/author/books') {
  return [
    {
      icon: LibraryIcon,
      id: '/',
      label: 'Библиотека',
      to: '/',
    },
    {
      icon: BookIcon,
      id: 'my-books',
      label: 'Мои книги',
      to: myBooksPath,
    },
  ] satisfies HeaderNavItem[]
}

export function getHeaderMobileNavigation(
  authorized: boolean,
  myBooksPath: '/library' | '/author/books',
): HeaderMobileNavItem[] {
  return [
    ...getHeaderNavigation(myBooksPath),
    {
      icon: UserIcon,
      id: authorized ? 'profile' : 'login',
      label: authorized ? 'Профиль' : 'Войти',
      to: authorized ? '/profile' : '/login',
    },
  ]
}
