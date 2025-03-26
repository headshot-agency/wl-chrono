"use client"

import { useState, useEffect, useRef } from 'react'
import TimerBox from './TimerBox'
import TimerControls from './TimerControls'
import TotalsDisplay from './TotalsDisplay'
import styles from './TimerContainer.module.css'

export default function TimerContainer() {
  // Stati per i tempi visualizzati
  const [workTime, setWorkTime] = useState(0)
  const [otherTime, setOtherTime] = useState(0)
  const [totalWorkTime, setTotalWorkTime] = useState(0)
  const [totalOtherTime, setTotalOtherTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [activeTimer, setActiveTimer] = useState('work')
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  
  // Riferimenti per gestire i timer e il recupero dopo standby
  const timerInterval = useRef(null)
  const activeTimerRef = useRef('work')
  const sessionId = useRef(Date.now().toString())
  const startTimeRef = useRef(null)
  const lastUpdateTimeRef = useRef(null)
  const visibilityChangeHandled = useRef(false)

  // Carica i dati dal localStorage all'avvio e crea una nuova sessione
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const today = getCurrentDateString()
      const storedData = localStorage.getItem('timerData')
      
      if (storedData) {
        const parsedData = JSON.parse(storedData)
        
        // Controlla se i dati sono di oggi
        if (parsedData.date === today) {
          setTotalWorkTime(parsedData.totalWorkTime || 0)
          setTotalOtherTime(parsedData.totalOtherTime || 0)
          setSessions(parsedData.sessions || [])
        } else {
          // Se i dati non sono di oggi, li resettiamo
          resetStoredData()
        }
      }
      
      // Crea una nuova sessione all'apertura della pagina
      const newSession = {
        id: sessionId.current,
        start: getCurrentTimeString(),
        workTime: 0,
        otherTime: 0
      }
      
      setCurrentSession(newSession)
    }
    
    // Cleanup quando la pagina viene chiusa/refreshata
    window.addEventListener('beforeunload', saveCurrentSession)
    
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
      }
      saveCurrentSession()
      window.removeEventListener('beforeunload', saveCurrentSession)
    }
  }, [])

  // Aggiungi gestione per visibilitychange e comportamento in background
  useEffect(() => {
    // Gestione dell'evento visibilitychange
    const handleVisibilityChange = () => {
      visibilityChangeHandled.current = true;
      
      if (document.hidden) {
        // L'app passa in background
        if (isRunning) {
          // Salviamo il timestamp corrente
          lastUpdateTimeRef.current = Date.now();
          
          // Fermiamo l'intervallo ma manteniamo lo stato running
          clearInterval(timerInterval.current);
        }
      } else {
        // L'app torna in primo piano
        if (isRunning) {
          // Calcoliamo quanto tempo è passato in background
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - lastUpdateTimeRef.current) / 1000);
          
          if (elapsedSeconds > 0) {
            // Aggiorniamo i timer
            if (activeTimerRef.current === 'work') {
              setWorkTime(prevTime => prevTime + elapsedSeconds);
              setTotalWorkTime(prevTime => prevTime + elapsedSeconds);
            } else {
              setOtherTime(prevTime => prevTime + elapsedSeconds);
              setTotalOtherTime(prevTime => prevTime + elapsedSeconds);
            }
          }
          
          // Riavvia l'intervallo
          startTimer();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listener per rilevare lo standby o la perdita di focus
    const checkInactivity = () => {
      if (isRunning && !document.hidden && !visibilityChangeHandled.current) {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
        
        // Se sono passati più di 2 secondi dall'ultimo aggiornamento,
        // presumiamo che il timer sia stato sospeso
        if (lastUpdateTimeRef.current && timeSinceLastUpdate > 2000) {
          const elapsedSeconds = Math.floor(timeSinceLastUpdate / 1000);
          
          if (elapsedSeconds > 0) {
            // Aggiorniamo i timer
            if (activeTimerRef.current === 'work') {
              setWorkTime(prevTime => prevTime + elapsedSeconds);
              setTotalWorkTime(prevTime => prevTime + elapsedSeconds);
            } else {
              setOtherTime(prevTime => prevTime + elapsedSeconds);
              setTotalOtherTime(prevTime => prevTime + elapsedSeconds);
            }
          }
        }
        
        lastUpdateTimeRef.current = now;
      }
      
      visibilityChangeHandled.current = false;
    };
    
    // Esegui il controllo ogni secondo per rilevare eventuali sospensioni
    const inactivityInterval = setInterval(checkInactivity, 1000);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(inactivityInterval);
    };
  }, [isRunning]);

  // Aggiorna il localStorage quando i totali cambiano
  useEffect(() => {
    if (typeof window !== 'undefined' && (totalWorkTime > 0 || totalOtherTime > 0)) {
      saveDataToStorage()
    }
  }, [totalWorkTime, totalOtherTime, sessions])

  // Aggiorniamo il ref quando cambia lo state
  useEffect(() => {
    activeTimerRef.current = activeTimer
  }, [activeTimer])

  // Salva la sessione corrente quando viene aggiornata
  useEffect(() => {
    if (currentSession) {
      // Aggiorneremo la sessione corrente nel localStorage
      // ma non aggiungiamo ancora alle sessions
      const sessionData = {
        ...currentSession,
        workTime,
        otherTime
      }
      localStorage.setItem('currentSession', JSON.stringify(sessionData))
    }
  }, [currentSession, workTime, otherTime])

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Ottiene la data corrente in formato YYYY-MM-DD
  const getCurrentDateString = () => {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  // Ottiene l'ora corrente in formato HH:MM
  const getCurrentTimeString = () => {
    const date = new Date()
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  // Salva la sessione corrente quando la pagina viene chiusa o aggiornata
  const saveCurrentSession = () => {
    if (currentSession && (workTime > 0 || otherTime > 0)) {
      const completedSession = {
        ...currentSession,
        end: getCurrentTimeString(),
        workTime,
        otherTime
      }
      
      setSessions(prev => [...prev, completedSession])
      
      // Aggiorna il localStorage direttamente per assicurarsi che i dati siano salvati
      // anche se l'evento beforeunload interrompe il rendering
      const storedData = localStorage.getItem('timerData')
      if (storedData) {
        const parsedData = JSON.parse(storedData)
        parsedData.sessions = [...parsedData.sessions, completedSession]
        localStorage.setItem('timerData', JSON.stringify(parsedData))
      }
      
      // Pulisci la sessione corrente
      localStorage.removeItem('currentSession')
    }
  }

  // Salva i dati nel localStorage
  const saveDataToStorage = () => {
    const data = {
      date: getCurrentDateString(),
      totalWorkTime,
      totalOtherTime,
      sessions
    }
    localStorage.setItem('timerData', JSON.stringify(data))
  }

  // Resetta i dati nel localStorage
  const resetStoredData = () => {
    localStorage.removeItem('timerData')
    localStorage.removeItem('currentSession')
    setTotalWorkTime(0)
    setTotalOtherTime(0)
    setSessions([])
  }

  const toggleTimer = () => {
    if (isRunning) {
      clearInterval(timerInterval.current)
      timerInterval.current = null
      setIsRunning(false)
      startTimeRef.current = null
    } else {
      startTimer()
    }
  }

  const startTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current)
    }
    
    // Salva il timestamp di inizio o aggiorna
    startTimeRef.current = Date.now()
    lastUpdateTimeRef.current = Date.now()
    
    timerInterval.current = setInterval(() => {
      const now = Date.now()
      lastUpdateTimeRef.current = now
      
      if (activeTimerRef.current === 'work') {
        setWorkTime(prev => prev + 1)
        setTotalWorkTime(prev => prev + 1)
      } else {
        setOtherTime(prev => prev + 1)
        setTotalOtherTime(prev => prev + 1)
      }
    }, 1000)
    
    setIsRunning(true)
  }

  const activateWorkTimer = () => {
    if (activeTimer !== 'work') {
      setActiveTimer('work')
      if (isRunning) {
        // No need to restart the timer
      } else {
        startTimer()
      }
    }
  }

  const activateOtherTimer = () => {
    if (activeTimer !== 'other') {
      setActiveTimer('other')
      if (isRunning) {
        // No need to restart the timer
      } else {
        startTimer()
      }
    }
  }

  const resetTimers = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current)
      timerInterval.current = null
    }
    
    setIsRunning(false)
    setWorkTime(0)
    setOtherTime(0)
    setActiveTimer('work')
    activeTimerRef.current = 'work'
    startTimeRef.current = null
  }

  const resetAllData = () => {
    // Ferma il timer se è in esecuzione
    if (timerInterval.current) {
      clearInterval(timerInterval.current)
      timerInterval.current = null
    }
    
    // Resetta tutti i valori
    setIsRunning(false)
    setWorkTime(0)
    setOtherTime(0)
    setActiveTimer('work')
    activeTimerRef.current = 'work'
    setTotalWorkTime(0)
    setTotalOtherTime(0)
    setSessions([])
    startTimeRef.current = null
    
    // Crea una nuova sessione
    const newSessionId = Date.now().toString()
    sessionId.current = newSessionId
    const newSession = {
      id: newSessionId,
      start: getCurrentTimeString(),
      workTime: 0,
      otherTime: 0
    }
    setCurrentSession(newSession)
    
    // Cancella tutti i dati dal localStorage
    localStorage.removeItem('timerData')
    localStorage.removeItem('currentSession')
  }

  return (
    <div className={styles.container}>
      <div className={styles.controlsContainer}>
        <TimerControls 
          isRunning={isRunning}
          onToggle={toggleTimer}
          onReset={resetTimers}
          onResetAll={resetAllData}
        />
      </div>
      
      <div className={styles.timersContainer}>
        <TimerBox 
          label="LAVORO"
          time={formatTime(workTime)}
          isActive={activeTimer === 'work'}
          onClick={activateWorkTimer}
        />
        
        <TimerBox 
          label="ALTRO"
          time={formatTime(otherTime)}
          isActive={activeTimer === 'other'}
          onClick={activateOtherTimer}
        />
      </div>
      
      <TotalsDisplay 
        workTotal={formatTime(totalWorkTime)}
        otherTotal={formatTime(totalOtherTime)}
        sessions={sessions}
        currentSession={currentSession ? 
          {...currentSession, workTime, otherTime, isActive: true} : 
          null}
      />
    </div>
  )
}