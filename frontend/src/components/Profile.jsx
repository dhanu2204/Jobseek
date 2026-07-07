import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Profile.css'
import ThemeToggle from './ThemeToggle'

const Profile = () => {
    const nav = useNavigate()
    const [user, setUser] = useState({
        id: null,
        name: '',
        email: '',
        mobile: '',
        headline: '',
        bio: '',
        skills: '',
        experienceLevel: 'Fresher',
        education: '',
        githubUrl: '',
        linkedinUrl: ''
    })
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [solvedChallenges, setSolvedChallenges] = useState([]);
    const [savedInterviews, setSavedInterviews] = useState([]);


    useEffect(() => {
        const userString = localStorage.getItem('user')
        const loggedUser = userString ? JSON.parse(userString) : null

        const fetchUserData = async () => {
            if (!loggedUser || !loggedUser.id) {
                alert("Please log in first!")
                nav('/login')
                return
            }

            setLoading(true)
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/get/${loggedUser.id}`)
                if (response.ok) {
                    const data = await response.json()
                    setUser(prev => ({
                        ...prev,
                        id: data.id,
                        name: data.name || '',
                        email: data.email || '',
                        mobile: data.mobile || '',
                        headline: data.headline || '',
                        bio: data.bio || '',
                        skills: data.skills || '',
                        experienceLevel: data.experienceLevel || 'Fresher',
                        education: data.education || '',
                        githubUrl: data.githubUrl || '',
                        linkedinUrl: data.linkedinUrl || ''
                    }))
                }
            } catch (error) {
                console.error("Error loading user profile:", error)
            } finally {
                setLoading(false)
            }
        }

        const fetchSolvedChallenges = async () => {
            if (!loggedUser || !loggedUser.id) return
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/challenge/user/${loggedUser.id}`)
                if (response.ok) {
                    const data = await response.json()
                    setSolvedChallenges(data || [])
                }
            } catch (err) {
                console.error("Error loading solved challenges:", err)
            }
        }

        const fetchSavedInterviews = async () => {
            if (!loggedUser || !loggedUser.id) return
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/interview-report/user/${loggedUser.id}`)
                if (response.ok) {
                    const data = await response.json()
                    setSavedInterviews(data || [])
                }
            } catch (err) {
                console.error("Error loading saved mock interviews:", err)
            }
        }

        fetchUserData() 
        fetchSolvedChallenges()
        fetchSavedInterviews()
    }, [nav])

    const handleChange = (e) => {
        const { name, value } = e.target
        setUser(prev => ({ ...prev, [name]: value }))
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(user)
            })

            if (response.ok) {
                const updatedData = await response.json()
                // Save updated user name back to local storage (so home avatar matches)
                localStorage.setItem('user', JSON.stringify({
                    id: updatedData.id,
                    name: updatedData.name,
                    email: updatedData.email
                }))
                alert("Profile updated successfully!")
            } else {
                alert("Failed to update profile.")
            }
        } catch (error) {
            console.error("Error updating profile:", error)
            alert("Error connecting to server.")
        } finally {
            setSaving(false)
        }
    }

    // 1. Audit list of fields to find which ones are empty
    const getAuditIssues = () => {
        const issues = []
        if (!user.name.trim()) issues.push({ field: 'name', label: 'Full Name is missing' })
        if (!user.mobile.trim()) issues.push({ field: 'mobile', label: 'Mobile Phone Number is empty' })
        if (!user.headline.trim()) issues.push({ field: 'headline', label: 'Professional Headline is empty' })
        if (!user.bio.trim()) issues.push({ field: 'bio', label: 'Bio summary is empty' })
        if (!user.skills.trim()) issues.push({ field: 'skills', label: 'Technical Skills list is missing' })
        if (!user.education.trim()) issues.push({ field: 'education', label: 'Education details are missing' })
        if (!user.githubUrl.trim()) issues.push({ field: 'githubUrl', label: 'GitHub portfolio link is missing' })
        if (!user.linkedinUrl.trim()) issues.push({ field: 'linkedinUrl', label: 'LinkedIn profile link is missing' })
        return issues
    }

    const auditIssues = getAuditIssues()
    const totalFields = 10
    const filledCount = totalFields - auditIssues.length
    const completionPercentage = Math.round((filledCount / totalFields) * 100)

    // Scroll and focus on the empty field input when user clicks the audit item
    const focusField = (fieldId) => {
        const element = document.getElementById(fieldId)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.focus()
        }
    }

    return (
        <div className="profile-container">
            <nav className="navbar">
                <div className="nav-logo" onClick={() => nav('/home')} style={{ cursor: 'pointer' }}>
                    JobSeek<span className="brand-dot"></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ThemeToggle />
                    <button onClick={() => nav('/home')} className="back-button">Back to Dashboard</button>
                </div>
            </nav>

            {loading && <div className="loading-spinner-wrapper"><div className="spinner"></div><p>Retrieving profile data...</p></div>}

            {!loading && (
                <div className="profile-workspace">
                    {/* Left Column - Edit Fields */}
                    <form onSubmit={handleSave} className="profile-form-panel">
                        <h2>My Profile</h2>
                        <p className="subtitle-text">Update your professional details to attract tech recruiters.</p>

                        <div className="profile-fields-grid">
                            <div className="profile-input-group">
                                <label className="profile-label">Full Name</label>
                                <input 
                                    type="text" 
                                    id="name"
                                    name="name" 
                                    value={user.name} 
                                    onChange={handleChange} 
                                    className="profile-input" 
                                    required 
                                />
                            </div>

                            <div className="profile-input-group">
                                <label className="profile-label">Email Address (Read Only)</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={user.email} 
                                    className="profile-input disabled" 
                                    disabled 
                                />
                            </div>

                            <div className="profile-input-group">
                                <label className="profile-label">Mobile Number</label>
                                <input 
                                    type="text" 
                                    id="mobile"
                                    name="mobile" 
                                    placeholder="+91 XXXXX XXXXX"
                                    value={user.mobile} 
                                    onChange={handleChange} 
                                    className="profile-input" 
                                />
                            </div>

                            <div className="profile-input-group">
                                <label className="profile-label">Professional Headline</label>
                                <input 
                                    type="text" 
                                    id="headline"
                                    name="headline" 
                                    placeholder="e.g. Full Stack Developer | Spring Boot & React"
                                    value={user.headline} 
                                    onChange={handleChange} 
                                    className="profile-input" 
                                />
                            </div>

                            <div className="profile-input-group">
                                <label className="profile-label">Experience Level</label>
                                <select 
                                    id="experienceLevel"
                                    name="experienceLevel" 
                                    value={user.experienceLevel} 
                                    onChange={handleChange} 
                                    className="profile-select"
                                >
                                    <option value="Fresher">Fresher (Graduate)</option>
                                    <option value="Mid-Level">Mid-Level (2-5 Years)</option>
                                    <option value="Senior">Senior (5+ Years)</option>
                                </select>
                            </div>

                            <div className="profile-input-group">
                                <label className="profile-label">Education details</label>
                                <input 
                                    type="text" 
                                    id="education"
                                    name="education" 
                                    placeholder="e.g. B.Tech Computer Science - University X (Grad. 2024)"
                                    value={user.education} 
                                    onChange={handleChange} 
                                    className="profile-input" 
                                />
                            </div>

                            <div className="profile-input-group">
                                <label className="profile-label">Technical Skills (comma-separated)</label>
                                <input 
                                    type="text" 
                                    id="skills"
                                    name="skills" 
                                    placeholder="e.g. Java, Python, SQL, AWS, Docker"
                                    value={user.skills} 
                                    onChange={handleChange} 
                                    className="profile-input" 
                                />
                            </div>

                            <div className="profile-input-group">
                                <label className="profile-label">GitHub Portfolio URL</label>
                                <input 
                                    type="url" 
                                    id="githubUrl"
                                    name="githubUrl" 
                                    placeholder="https://github.com/username"
                                    value={user.githubUrl} 
                                    onChange={handleChange} 
                                    className="profile-input" 
                                />
                            </div>

                            <div className="profile-input-group">
                                <label className="profile-label">LinkedIn Profile URL</label>
                                <input 
                                    type="url" 
                                    id="linkedinUrl"
                                    name="linkedinUrl" 
                                    placeholder="https://linkedin.com/in/username"
                                    value={user.linkedinUrl} 
                                    onChange={handleChange} 
                                    className="profile-input" 
                                />
                            </div>

                            <div className="profile-input-group full-width">
                                <label className="profile-label">About Me (Bio)</label>
                                <textarea 
                                    id="bio"
                                    name="bio" 
                                    placeholder="Briefly describe your career objectives and what you build..."
                                    value={user.bio} 
                                    onChange={handleChange} 
                                    className="profile-textarea" 
                                    rows="5"
                                ></textarea>
                            </div>
                        </div>

                        <button type="submit" className="save-profile-btn" disabled={saving}>
                            {saving ? 'Saving changes...' : 'Save Changes'}
                        </button>
                    </form>

                    {/* Right Column - Audit Dashboard */}
                    <div className="profile-audit-panel">
                        <div className="audit-card-wrapper">
                            <h3>Profile Strength</h3>
                            
                            {/* Radial Progress Score Indicator */}
                            <div className="progress-meter-container">
                                <svg className="progress-circle-svg" viewBox="0 0 36 36">
                                    <path className="circle-bg-line" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path className="circle-progress-line" strokeDasharray={`${completionPercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                                <div className="meter-value-label">{completionPercentage}%</div>
                            </div>

                            <p className="meter-summary-text">
                                {completionPercentage === 100 
                                    ? '🎉 Your profile is 100% complete! Recruiter reach will increase.' 
                                    : 'Complete the missing sections below to reach 100%.'}
                            </p>
                            {solvedChallenges.length > 0 && (
                                    <div className="unfilled-checklist-card" style={{ marginTop: '20px' }}>
                                    <h4>Solved Coding Challenges ({solvedChallenges.length})</h4>
                                    <div className="issues-list">
                                        {solvedChallenges.map((item, idx) => (
                                        <div key={idx} className="issue-alert-row" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                                            <span className="alert-bullet">🏆</span>
                    <span className="alert-text-label" style={{ color: '#166534' }}>
                        {item.problemTitle} ({item.language})
                    </span>
                </div>
            ))}
        </div>
    </div>
)}

                            {savedInterviews.length > 0 && (
                                <div className="unfilled-checklist-card" style={{ marginTop: '20px' }}>
                                    <h4>Mock Interview History ({savedInterviews.length})</h4>
                                    <div className="issues-list">
                                        {savedInterviews.map((item, idx) => {
                                            let strengths = []
                                            let improvements = []
                                            let questionScores = []
                                            try {
                                                strengths = item.strengthsJson ? JSON.parse(item.strengthsJson) : []
                                                improvements = item.improvementsJson ? JSON.parse(item.improvementsJson) : []
                                                questionScores = item.questionScoresJson ? JSON.parse(item.questionScoresJson) : []
                                            } catch (e) {
                                                console.error("Error parsing JSON for report ID: " + item.id, e)
                                            }

                                            return (
                                                <div key={idx} className="interview-history-card">
                                                    <div className="history-header">
                                                        <strong>{item.jobTitle}</strong>
                                                        <span className="history-score">{item.score}%</span>
                                                    </div>
                                                    <div className="history-meta">
                                                        Level: {item.difficulty} | Questions: {questionScores.length}
                                                    </div>
                                                    <div className="history-details-toggle">
                                                        <details style={{ marginTop: '8px' }}>
                                                            <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#4f46e5' }}>View Full Evaluation Details</summary>
                                                            <div className="history-details-content" style={{ marginTop: '8px', fontSize: '0.8rem', color: '#374151' }}>
                                                                {strengths.length > 0 && (
                                                                    <div style={{ marginBottom: '6px' }}>
                                                                        <strong>Key Strengths:</strong>
                                                                        <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                                                                            {strengths.map((str, sIdx) => <li key={sIdx}>✅ {str}</li>)}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                                {improvements.length > 0 && (
                                                                    <div style={{ marginBottom: '6px' }}>
                                                                        <strong>Areas for Improvement:</strong>
                                                                        <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                                                                            {improvements.map((imp, iIdx) => <li key={iIdx}>💡 {imp}</li>)}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                                {questionScores.length > 0 && (
                                                                    <div>
                                                                        <strong>Question Breakdown:</strong>
                                                                        <div style={{ maxHeight: '150px', overflowY: 'auto', marginTop: '4px', border: '1px solid #e5e7eb', padding: '6px', borderRadius: '4px', backgroundColor: '#f9fafb' }}>
                                                                            {questionScores.map((qs, qIdx) => (
                                                                                <div key={qIdx} style={{ paddingBottom: '6px', borderBottom: qIdx === questionScores.length - 1 ? 'none' : '1px solid #f3f4f6', marginBottom: '6px' }}>
                                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                                                        <span>Q{qIdx + 1}: {qs.question}</span>
                                                                                        <span style={{ color: '#059669' }}>{qs.score}/10</span>
                                                                                    </div>
                                                                                    <div style={{ color: '#4b5563', fontStyle: 'italic', marginTop: '2px' }}>Your Answer: {qs.answer || '[No Answer]'}</div>
                                                                                    <div style={{ color: '#2563eb', marginTop: '2px' }}>Feedback: {qs.critique}</div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </details>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>  

                        {auditIssues.length > 0 && (
                            <div className="unfilled-checklist-card">
                                <h4>Unfilled Fields ({auditIssues.length})</h4>
                                <div className="issues-list">
                                    {auditIssues.map((issue, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => focusField(issue.field)}
                                            className="issue-alert-row"
                                        >
                                            <span className="alert-bullet">⚠️</span>
                                            <span className="alert-text-label">{issue.label}</span>
                                            <span className="edit-shortcut-btn">Edit ✏️</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Profile
