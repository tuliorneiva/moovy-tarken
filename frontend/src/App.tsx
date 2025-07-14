import './App.css'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import Search from './pages/Search'
import Library from './pages/Library'

function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="w-full flex justify-between items-center p-4 gap-10 bg-gradient-to-r from-orange-600 to-orange-400 shadow-lg">
      <h1 className="text-3xl font-extrabold text-white tracking-wide drop-shadow">Moovy</h1>
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/search')} className="bg-white/80 text-orange-700 font-bold px-4 py-2 rounded-lg shadow hover:bg-white transition-all duration-200 border border-orange-200 hover:scale-105">Search</button>
        <button onClick={() => navigate('/library')} className="bg-white/80 text-orange-700 font-bold px-4 py-2 rounded-lg shadow hover:bg-white transition-all duration-200 border border-orange-200 hover:scale-105">My Library</button>
      </div>
    </nav>
  )
}

function App() {
  return (
    <Router>
    <div className="min-h-screen h-full">
        <Navbar />
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/search" element={<Search />} />
          <Route path="/library" element={<Library />} />
        </Routes>
        </div>
    </Router>
  )
}

export default App