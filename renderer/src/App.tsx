import { Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { Editor } from './pages/Editor'

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project/:projectId" element={<Editor />} />
      </Routes>
    </div>
  )
}
