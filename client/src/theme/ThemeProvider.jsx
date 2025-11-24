import { createContext, useContext } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const theme = {
    colors: {
      primary: {
        50: '#e6f2ff',
        100: '#b3d9ff',
        200: '#80bfff',
        300: '#4da6ff',
        400: '#1a8cff',
        500: '#0073e6',
        600: '#005cb3',
        700: '#004580',
        800: '#002e4d',
        900: '#00171a',
      },
      secondary: {
        50: '#e6f7f0',
        100: '#b3e6d1',
        200: '#80d5b2',
        300: '#4dc493',
        400: '#1ab374',
        500: '#009255',
        600: '#007544',
        700: '#005833',
        800: '#003b22',
        900: '#001e11',
      },
      accent: {
        50: '#fff4e6',
        100: '#ffe0b3',
        200: '#ffcc80',
        300: '#ffb84d',
        400: '#ffa41a',
        500: '#ff8c00',
        600: '#cc7000',
        700: '#995400',
        800: '#663800',
        900: '#331c00',
      },
    },
    spacing: {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
    },
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}

