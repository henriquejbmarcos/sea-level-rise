import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SeaLevelRise from './SeaLevelRise.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SeaLevelRise />
  </StrictMode>,
)
