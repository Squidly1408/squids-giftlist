import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SetupNeeded } from './SetupNeeded.tsx'
import { isFirebaseConfigured } from './lib/firebase.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isFirebaseConfigured ? <App /> : <SetupNeeded />}</StrictMode>
)
