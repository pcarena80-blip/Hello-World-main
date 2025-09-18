import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/responsive.css'
import { AuthProvider } from './contexts/AuthContext'
import { TaskProvider } from './contexts/TaskContext'

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <TaskProvider>
      <App />
    </TaskProvider>
  </AuthProvider>
);
