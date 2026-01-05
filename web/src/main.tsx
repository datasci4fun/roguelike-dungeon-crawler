import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AudioProvider } from './contexts/AudioContext'
import { GameProvider } from './contexts/GameContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          <AudioProvider>
            <App />
          </AudioProvider>
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
