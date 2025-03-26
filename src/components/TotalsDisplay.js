import styles from './TotalsDisplay.module.css';

export default function TotalsDisplay({ workTotal, otherTotal, sessions = [], currentSession = null }) {
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        Totali di oggi
      </div>
      
      <div className={styles.grid}>
        <div className={styles.item}>
          <span>Lavoro:</span>
          <span>{workTotal}</span>
        </div>
        
        <div className={styles.item}>
          <span>Altro:</span>
          <span>{otherTotal}</span>
        </div>
      </div>

      <div className={styles.sessions}>
        <div className={styles.sessionsTitle}>Sessioni</div>
        <div className={styles.sessionsList}>
          {/* Mostra la sessione corrente se esiste */}
          {currentSession && (
            <div className={`${styles.sessionItem} ${styles.currentSession}`}>
              <div className={styles.sessionTime}>
                {currentSession.start} - <span className={styles.activeText}>In corso</span>
              </div>
              <div className={styles.sessionDetails}>
                <span>L: {formatTime(currentSession.workTime)}</span>
                <span>A: {formatTime(currentSession.otherTime)}</span>
              </div>
            </div>
          )}
          
          {/* Mostra le sessioni precedenti */}
          {sessions.map((session, index) => (
            <div key={session.id || index} className={styles.sessionItem}>
              <div className={styles.sessionTime}>
                {session.start} - {session.end}
              </div>
              <div className={styles.sessionDetails}>
                <span>L: {formatTime(session.workTime)}</span>
                <span>A: {formatTime(session.otherTime)}</span>
              </div>
            </div>
          ))}
          
          {/* Mostra un messaggio se non ci sono sessioni */}
          {!currentSession && sessions.length === 0 && (
            <div className={styles.emptyMessage}>
              Nessuna sessione registrata oggi
            </div>
          )}
        </div>
      </div>
    </div>
  );
}