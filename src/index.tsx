import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

const rootEl = document.getElementById('root')
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl)
  // StrictMode double-invokes only in DEV; omit wrapper in prod builds.
  root.render(
    import.meta.env.DEV ? (
      <React.StrictMode>
        <App />
      </React.StrictMode>
    ) : (
      <App />
    ),
  )
}
