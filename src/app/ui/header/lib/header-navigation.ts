import { defaultBookFilters } from '@modules/books/model'

import LibraryIcon from '@shared/assets/icons/icon (2).svg?react'
import BookIcon from '@shared/assets/icons/Vector (14).svg?react'
import UserIcon from '@shared/assets/icons/user.svg?react'

import type { ComponentType, SVGProps } from 'react'

type HeaderNavItem = {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  id: string
  label: string
  search: typeof defaultBookFilters
  to: '/'
}

type HeaderMobileRouteItem = {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  id: string
  label: string
  to: '/login' | '/profile'
}

export type HeaderMobileNavItem = HeaderNavItem | HeaderMobileRouteItem

export const headerNavigation: HeaderNavItem[] = [
  {
    icon: LibraryIcon,
    id: 'library',
    label: 'Библиотека',
    search: defaultBookFilters,
    to: '/',
  },
  {
    icon: BookIcon,
    id: 'my-books',
    label: 'Мои книги',
    search: defaultBookFilters,
    to: '/',
  },
]

export function getHeaderMobileNavigation(
  authorized: boolean,
): HeaderMobileNavItem[] {
  return [
    ...headerNavigation,
    {
      icon: UserIcon,
      id: authorized ? 'profile' : 'login',
      label: authorized ? 'Профиль' : 'Войти',
      to: authorized ? '/profile' : '/login',
    },
  ]
}
