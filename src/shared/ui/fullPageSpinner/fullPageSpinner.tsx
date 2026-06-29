import { Spinner } from '../spinner/spinner'
import styles from './fullPageSpinner.module.scss'

export function FullPageSpinner() {
  return (
    <main className={styles.fullPageLoader}>
      <Spinner label="Загружаем профиль" />
    </main>
  )
}
