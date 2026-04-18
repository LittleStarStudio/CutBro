import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppSettingsProvider } from "@/components/context/AppSettingsContext";
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppSettingsProvider>
      <App />   
    </AppSettingsProvider>
  </StrictMode>,
)
