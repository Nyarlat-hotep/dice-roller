import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyAccent, getStoredAccent } from './components/AccentPicker'

// Apply the saved accent before first paint to avoid a colour flash.
applyAccent(getStoredAccent())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
