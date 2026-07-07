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
import Library from './components/Library' // Imported Library
import Payment from './components/Payment'

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
      <Route path="/ats" element={<AtsChecker />} />
      <Route path="/interview" element={<MockInterview />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/playground" element={<Playground />} /> 
      <Route path="/library" element={<Library />} /> 
      <Route path="/payment" element={<Payment />} /> 
    </Routes>
    </BrowserRouter>
  )
}

export default App