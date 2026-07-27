
import { RouterProvider } from 'react-router-dom'
import { AppDataProvider } from './context/AppDataContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { router } from './router.jsx'
import ErrorBoundary from './components/layout/ErrorBoundary.jsx'

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppDataProvider>
          <RouterProvider router={router} />
        </AppDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
