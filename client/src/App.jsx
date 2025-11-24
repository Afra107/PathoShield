import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './theme/ThemeProvider'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Prediction from './pages/Prediction'
import Surveillance from './pages/Surveillance'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/prediction" element={<Prediction />} />
              <Route path="/surveillance" element={<Surveillance />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App


