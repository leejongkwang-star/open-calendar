import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { APP_TITLE } from './utils/branding'
import './styles/index.css'

document.title = APP_TITLE

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

