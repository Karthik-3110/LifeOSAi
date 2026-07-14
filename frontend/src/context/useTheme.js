import { useContext } from 'react'
import { ThemeContext } from './theme-context.js'

export function useTheme() {
  return useContext(ThemeContext)
}
