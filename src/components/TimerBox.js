import styles from './TimerBox.module.css';

export default function TimerBox({ label, time, isActive, onClick }) {
  return (
    <div 
      className={`${styles.timerBox} ${isActive ? styles.active : styles.inactive}`}
      onClick={onClick}
    >
      {isActive && (
        <div className={styles.runningLight}></div>
      )}
      
      <div className={styles.label}>
        {label}
      </div>
      
      <div className={`${styles.time} ${isActive ? styles.timeActive : ''}`}>
        {time}
      </div>
    </div>
  )
}