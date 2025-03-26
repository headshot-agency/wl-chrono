import styles from './TimerControls.module.css';

export default function TimerControls({ isRunning, onToggle, onReset }) {
  return (
    <div className={styles.container}>
      <button 
        className={`${styles.button} ${styles.primaryButton}`}
        onClick={onToggle}
      >
        {isRunning ? 'PAUSA' : 'INIZIA'}
      </button>
      
      <button 
        className={`${styles.button} ${styles.secondaryButton}`}
        onClick={onReset}
      >
        RESET
      </button>
    </div>
  )
}