import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <App />
  )
} catch (e: any) {
  if (window.onerror) {
    window.onerror(e.message || String(e), 'main.tsx', 0, 0, e);
  }
}
