import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './index.css'

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <ErrorBoundary name="Vacay">
      <App />
    </ErrorBoundary>
  )
} catch (e: unknown) {
  const err = e instanceof Error ? e : new Error(String(e));
  if (window.onerror) {
    window.onerror(err.message, 'main.tsx', 0, 0, err);
  }
}
