import { createElement, lazy, Suspense } from 'react'
import { createHashRouter } from 'react-router-dom'
import AppShell from './components/layout/AppShell.jsx'
import PageLoader from './components/layout/PageLoader.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'

const homePage = lazy(() => import('./pages/Home.jsx'))
const authPage = lazy(() => import('./pages/Auth.jsx'))
const dashboardPage = lazy(() => import('./pages/Dashboard.jsx'))
const canvasPage = lazy(() => import('./pages/Canvas.jsx'))
const plannerPage = lazy(() => import('./pages/Planner.jsx'))
const analyticsPage = lazy(() => import('./pages/Analytics.jsx'))
const settingsPage = lazy(() => import('./pages/Settings.jsx'))
const infoPage = lazy(() => import('./pages/InfoPage.jsx'))
const semesterCopilotPage = lazy(() => import('./pages/SemesterCopilot.jsx'))
const studyTimetablePage = lazy(() => import('./pages/StudyTimetable.jsx'))

function lazyPage(Page) {
  return <Suspense fallback={<PageLoader />}>{createElement(Page)}</Suspense>
}

export const router = createHashRouter([
  {
    path: '/',
    element: lazyPage(homePage),
  },
  {
    path: '/auth',
    element: lazyPage(authPage),
  },
  {
    path: '/:slug',
    element: lazyPage(infoPage),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: lazyPage(dashboardPage) },
          { path: '/canvas', element: lazyPage(canvasPage) },
          { path: '/planner', element: lazyPage(plannerPage) },
          { path: '/analytics', element: lazyPage(analyticsPage) },
          { path: '/semester-copilot', element: lazyPage(semesterCopilotPage) },
          { path: '/study-timetable', element: lazyPage(studyTimetablePage) },
          { path: '/assistant', element: lazyPage(canvasPage) },
          { path: '/profile', element: lazyPage(settingsPage) },
          { path: '/settings', element: lazyPage(settingsPage) },
        ],
      },
    ],
  },
])
