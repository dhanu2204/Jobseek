import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css' // Import CSS styles
import ThemeToggle from './ThemeToggle'

const Home = () => {
  const nav = useNavigate()

  
  const userString = localStorage.getItem('user')
  const user = userString ? JSON.parse(userString) : null
  const [isPremium,setIsPremium] = useState(user?.premium || false)
  const initials = user && user.name 
  ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
  : 'JS'
  
  const [usage,setUsage] = useState({
    resumeCount: 0,atsScanCount: 0,interviewsCount: 0
  })
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  useEffect(()=>{
    const fetchUsage = async()=>{
      if(!user || !user.id)return;
      try
      {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/usage/${user.id}`);
        if(res.ok)
        {
          const data = await res.json()
          setUsage(data)
        }
      }catch(err){
        console.log("Usage fetch failed:",err)
      }
    };
    fetchUsage()
  },[])

  const handleNavigation = (path,currentCount)=>{
    if(!isPremium && currentCount >= 100)
    {
      setShowPremiumModal(true);
    }
    else{
      nav(path)
    }
  }
  const handleLogout = () => {
    localStorage.removeItem('user') // Clear user session details
    nav('/')
  }

  const handleUpgrade = async()=>{
    nav('/payment')
  }

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="nav-logo" onClick={() => nav('/home')} style={{ cursor: 'pointer' }}>
          JobSeek<span className="brand-dot"></span>
        </div>
        <div className="nav-profile">
          <ThemeToggle />
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

      {!isPremium && (
        <div className="premium-banner">
    <div className="banner-left">
      <span className="banner-badge">PRO PLAN</span>
      <h2>Upgrade to JobSeek Premium</h2>
      <p>Remove all limits on Resumes, ATS scans, and Mock Interviews. Get unlimited AI coaching.</p>
    </div>
    <button className="upgrade-banner-btn" onClick={handleUpgrade}>
      Buy Premium ✨
    </button>
  </div>
      )}

      <div className="dashboard-welcome">
        <h1 className="welcome-title">Developer Workspace</h1>
        <p className="welcome-tagline">Your Complete Job Assistant, All in One Place.</p>
        <p className="welcome-subtitle">Accelerate your career, build resumes, prepare for voice interviews, and solve sandbox exercises.</p>
        
        {/* Decorative inline SVG metric graph */}
        <div className="hero-svg-container">
          <svg className="hero-svg" viewBox="0 0 800 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="800" height="120" rx="16" fill="url(#hero-gradient)" fillOpacity="0.04" />
            <path d="M50 90 Q150 20 250 80 T450 30 T650 70 T750 20" stroke="url(#line-gradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="50" cy="90" r="5" fill="#4f46e5" />
            <circle cx="250" cy="80" r="5" fill="#818cf8" />
            <circle cx="450" cy="30" r="5" fill="#2dd4bf" />
            <circle cx="650" cy="70" r="5" fill="#0d9488" />
            <defs>
              <linearGradient id="hero-gradient" x1="0" y1="0" x2="800" y2="120" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4f46e5" />
                <stop offset="1" stopColor="#2dd4bf" />
              </linearGradient>
              <linearGradient id="line-gradient" x1="50" y1="60" x2="750" y2="60" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4f46e5" />
                <stop offset="0.5" stopColor="#818cf8" />
                <stop offset="1" stopColor="#2dd4bf" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="creative-nav-grid">
        <div className="nav-card card-blue" onClick={() => nav('/jobs')}>
          <span className="card-icon">🔍</span>
          <h3>Find New Jobs</h3>
          <p>Browse listings and track matching applications.</p>
          <span className="card-action-arrow">Explore →</span>
        </div>

        <div className="nav-card card-green" onClick={() => handleNavigation('/resume', usage.resumesCount)}
>
          <span className="card-icon">📄</span>
          <h3>Resume Builder</h3>
          <p>Design a recruiter-optimized CV with A4 PDF export templates.</p>
          <span className="card-action-arrow">Design →</span>
        </div>

        <div className="nav-card card-indigo" onClick={() => handleNavigation('/ats', usage.atsScansCount)}>
          <span className="card-icon">⚡</span>
          <h3>ATS Analyzer</h3>
          <p>Audit layout structures, scan keywords, and audit formatting issues.</p>
          <span className="card-action-arrow">Analyze →</span>
        </div>

        <div className="nav-card card-orange"onClick={() => handleNavigation('/interview', usage.interviewsCount)}>
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

        <div className="nav-card card-teal" onClick={() => nav('/library')}>
          <span className="card-icon">📚</span>
          <h3>My Collections Library</h3>
          <p>View, print, and download your saved resumes and interview scorecards.</p>
          <span className="card-action-arrow">View Library →</span>
        </div>
      </div>

      {/* Premium Limit Popup Modal */}
      {showPremiumModal && (
        <div className="modal-overlay">
          <div className="premium-modal-card">
            <div className="modal-icon">✨</div>
            <h3>Premium Limit Reached</h3>
            <p>You have reached the free limit of 100 items. Upgrade to Premium to get unlimited access and full resume designs!</p>
            <div className="modal-actions-row">
              <button className="upgrade-buy-btn" onClick={handleUpgrade}>
                Buy Premium ($9.99)
              </button>
              <button className="modal-cancel-btn" onClick={() => setShowPremiumModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Footer */}
      <footer className="dashboard-footer">
        <div className="footer-section">
          <h4>About JobSeek</h4>
          <p>JobSeek is a comprehensive developer workspace that streamlines your job search, automates resume building, simulates real-time AI interviews, and helps you practice challenges in a sandbox environment.</p>
        </div>
        <div className="footer-section">
          <h4>Our Services</h4>
          <ul className="footer-links">
            <li onClick={() => nav('/resume')}>📄 Resume Builder - Design A4 Templates</li>
            <li onClick={() => nav('/ats')}>⚡ ATS Keyword Analyzer - Score Resumes</li>
            <li onClick={() => nav('/interview')}>🎙️ AI Voice Mock Interview - Voice Practice</li>
            <li onClick={() => nav('/playground')}>💻 Code Sandbox - Monaco Editor Exercises</li>
            <li onClick={() => nav('/library')}>📚 Collections Library - PDF & JSON Downloads</li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Contact Me</h4>
          <p>Have feedback or questions? Reach out directly!</p>
          <a href="mailto:support@jobseek.ai" className="footer-contact-link">📧 support@jobseek.ai</a>
          <div className="footer-socials">
            <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a> • 
            <a href="https://linkedin.com" target="_blank" rel="noreferrer"> LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home