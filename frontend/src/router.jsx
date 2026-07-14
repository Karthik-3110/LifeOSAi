import { createBrowserRouter } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Auth from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Canvas from './pages/Canvas.jsx'
import Planner from './pages/Planner.jsx'
import Analytics from './pages/Analytics.jsx'
import Settings from './pages/Settings.jsx'
import InfoPage from './pages/InfoPage.jsx'
import AppShell from './components/layout/AppShell.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    path: '/:slug',
    element: <InfoPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/canvas', element: <Canvas /> },
          { path: '/planner', element: <Planner /> },
          { path: '/analytics', element: <Analytics /> },
          { path: '/assistant', element: <Canvas /> },
          { path: '/settings', element: <Settings /> },
        ],
      },
    ],
  },
])
