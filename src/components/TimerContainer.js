"use client"

import { useState, useEffect, useRef } from 'react'
import TimerBox from './TimerBox'
import TimerControls from './TimerControls'
import TotalsDisplay from './TotalsDisplay'
import styles from './TimerContainer.module.css'

export default function TimerContainer() {
  const [workTime, setWorkTime] = useState(0)
  const [otherTime, setOtherTime] = useState(0)
  const [totalWorkTime, setTotalWorkTime] = useState(0)
  const [totalOtherTime, setTotalOtherTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [activeTimer, setActiveTimer] = useState('work')
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  
  const timerInterval = useRef(null)
  const activeTimerRef = useRef('work')
  const sessionId = useRef(Date.now().toString())

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

  // Aggiorna il localStorage quando i totali o le sessioni cambiano
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
      
      // Non creiamo più una nuova sessione quando mettiamo in pausa
    } else {
      startTimer()
    }
  }

  const startTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current)
    }
    
    timerInterval.current = setInterval(() => {
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
  }

  return (
    <div className={styles.container}>
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
      
      <TimerControls 
        isRunning={isRunning}
        onToggle={toggleTimer}
        onReset={resetTimers}
      />
      
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