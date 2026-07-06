import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css' // Import CSS styles

const Home = () => {
  const nav = useNavigate()

  const userString = localStorage.getItem('user')
  const user = userString ? JSON.parse(userString) : null
  const initials = user && user.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'JS'

  const handleLogout = () => {
    localStorage.removeItem('user') // Clear user session details
    nav('/')
  }

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="nav-logo" onClick={() => nav('/home')} style={{ cursor: 'pointer' }}>
          JobSeek<span className="brand-dot"></span>
        </div>
        <div className="nav-profile">
          <div 
            className="profile-avatar" 
            onClick={() => nav('/profile')} 
            style={{ cursor: 'pointer' }}
            title="View Profile"
          >
            {initials}
          </div>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </nav>

      <div className="dashboard-welcome">
        <h1 className="welcome-title">Developer Workspace</h1>
        <p className="welcome-subtitle">Accelerate your career, build resumes, prepare for voice interviews, and solve sandbox exercises.</p>
      </div>

      <div className="creative-nav-grid">
        <div className="nav-card card-blue" onClick={() => nav('/jobs')}>
          <span className="card-icon">🔍</span>
          <h3>Find New Jobs</h3>
          <p>Browse listings and track matching applications.</p>
          <span className="card-action-arrow">Explore →</span>
        </div>

        <div className="nav-card card-green" onClick={() => nav('/resume')}>
          <span className="card-icon">📄</span>
          <h3>Resume Builder</h3>
          <p>Design a recruiter-optimized CV with A4 PDF export templates.</p>
          <span className="card-action-arrow">Design →</span>
        </div>

        <div className="nav-card card-indigo" onClick={() => nav('/ats')}>
          <span className="card-icon">⚡</span>
          <h3>ATS Analyzer</h3>
          <p>Audit layout structures, scan keywords, and audit formatting issues.</p>
          <span className="card-action-arrow">Analyze →</span>
        </div>

        <div className="nav-card card-orange" onClick={() => nav('/interview')}>
          <span className="card-icon">🎙️</span>
          <h3>Mock Interview</h3>
          <p>Practice verbal answers with Gemini scans of your projects.</p>
          <span className="card-action-arrow">Practice →</span>
        </div>

        <div className="nav-card card-purple" onClick={() => nav('/playground')}>
          <span className="card-icon">💻</span>
          <h3>Coding Sandbox</h3>
          <p>Solve dynamic AI-generated problems inside Monaco Editor.</p>
          <span className="card-action-arrow">Playground →</span>
        </div>
      </div>
    </div>
  )
}

export default Home