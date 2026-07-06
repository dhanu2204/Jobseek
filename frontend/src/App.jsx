import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom'
import Login from './components/Login'
import Home from './components/Home'
import Register from './components/Register'
import Jobs from './components/Jobs'
import ResumeBuilder from './components/ResumeBuilder'
import AtsChecker from './components/AtsChecker' // Imported AtsChecker
import MockInterview from './components/MockInterview' // Imported MockInterview
import Profile from './components/Profile' // Imported Profile
import Playground from './components/Playground'


const App = () => {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/resume" element={<ResumeBuilder />} />
      <Route path="/ats" element={<AtsChecker />} /> {/* Registered route */}
      <Route path="/interview" element={<MockInterview />} /> {/* Registered route */}
      <Route path="/profile" element={<Profile />} /> {/* Registered route */}
      <Route path="/playground" element={<Playground />} /> {/* Registered route */}
    </Routes>
    </BrowserRouter>
  )
}

export default App