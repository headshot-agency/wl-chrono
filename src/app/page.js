"use client"

import { useState, useEffect } from 'react'
import TimerContainer from '@/components/TimerContainer'
import '@/app/globals.css'

export default function Home() {
  return (
    <main className="main-container">
      <TimerContainer />
    </main>
  )
}