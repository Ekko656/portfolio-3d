import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Note: StrictMode is intentionally off — its dev-only double-mount races
// R3F suspense with 200+ asset promises (URDF + STL + GLTF) and can hang the
// scene on load. Production semantics are unaffected.
createRoot(document.getElementById('root')!).render(<App />)
