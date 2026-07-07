import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Library.css'
import ThemeToggle from './ThemeToggle'

const Library = () => {
    const nav = useNavigate()
    const [activeTab, setActiveTab] = useState('resumes') // resumes, reports
    const [resumes, setResumes] = useState([])
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(false)
    const [printTarget, setPrintTarget] = useState(null) // { type: 'resume' | 'report', data: object }

    const fetchLibraryData = async () => {
        const userString = localStorage.getItem('user')
        const loggedUser = userString ? JSON.parse(userString) : null
        if (!loggedUser || !loggedUser.id) {
            alert('Please log in first!')
            nav('/login')
            return
        }

        setLoading(true)
        try {
            // Fetch Resumes
            const resumeRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/resume/get/${loggedUser.id}`)
            if (resumeRes.ok) {
                const resumeData = await resumeRes.json()
                setResumes(resumeData || [])
            }

            // Fetch Interview Reports
            const reportRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/interview-report/user/${loggedUser.id}`)
            if (reportRes.ok) {
                const reportData = await reportRes.json()
                setReports(reportData || [])
            }
        } catch (error) {
            console.error("Error loading library data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLibraryData()
    }, [nav])

    const handleDeleteResume = async (id) => {
        if (!window.confirm("Are you sure you want to delete this resume?")) return
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/resume/delete/${id}`, {
                method: 'DELETE'
            })
            if (response.ok) {
                alert("Resume deleted successfully!")
                fetchLibraryData()
            } else {
                alert("Failed to delete resume.")
            }
        } catch (error) {
            console.error("Error deleting resume:", error)
        }
    }

    const downloadJSON = (data, filename) => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute('download', filename);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }

    const handlePrint = (type, data) => {
        setPrintTarget({ type, data })
        setTimeout(() => {
            window.print()
        }, 200)
    }

    return (
        <div className="library-container">
            {/* Header navbar */}
            <nav className="navbar no-print">
                <div className="nav-logo" onClick={() => nav('/home')} style={{ cursor: 'pointer' }}>
                    JobSeek<span className="brand-dot"></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ThemeToggle />
                    <button onClick={() => nav('/home')} className="back-button">Back to Dashboard</button>
                </div>
            </nav>

            <div className="library-workspace no-print">
                <div className="library-header">
                    <h2>My Collections Library</h2>
                    <p className="subtitle">Access, download, or print your saved resumes and mock interview performance reports.</p>
                </div>

                {/* Tab buttons */}
                <div className="library-tabs-bar">
                    <button 
                        onClick={() => setActiveTab('resumes')} 
                        className={`library-tab-btn ${activeTab === 'resumes' ? 'active' : ''}`}
                    >
                        📄 Saved Resumes ({resumes.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('reports')} 
                        className={`library-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
                    >
                        🎙️ Mock Interview Reports ({reports.length})
                    </button>
                </div>

                {loading && (
                    <div className="library-loading">
                        <div className="spinner"></div>
                        <p>Loading library items...</p>
                    </div>
                )}

                {!loading && (
                    <div className="library-content-panel">
                        {/* Resumes List */}
                        {activeTab === 'resumes' && (
                            <div className="library-grid">
                                {resumes.length === 0 ? (
                                    <div className="empty-library-state">
                                        <span className="empty-icon">📄</span>
                                        <p>No saved resumes found. Go to the Resume Builder to create one!</p>
                                        <button onClick={() => nav('/resume')} className="action-link-btn">Create Resume Now</button>
                                    </div>
                                ) : (
                                    resumes.map((res) => (
                                        <div key={res.id} className="library-card">
                                            <div className="card-header-icon">📄</div>
                                            <h3>{res.fullName || 'Unnamed Resume'}</h3>
                                            <p className="card-meta">Email: {res.email || 'N/A'}</p>
                                            <p className="card-meta">Skills: {res.skillsJson ? res.skillsJson.split(',').length : 0} defined</p>
                                            <div className="card-actions-row">
                                                <button onClick={() => handlePrint('resume', res)} className="card-action-btn print-btn">
                                                    🖨️ Print / PDF
                                                </button>
                                                <button onClick={() => downloadJSON(res, `${res.fullName || 'resume'}_data.json`)} className="card-action-btn download-json-btn">
                                                    💾 JSON
                                                </button>
                                                <button onClick={() => handleDeleteResume(res.id)} className="card-action-btn delete-btn">
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Interview Reports List */}
                        {activeTab === 'reports' && (
                            <div className="library-grid">
                                {reports.length === 0 ? (
                                    <div className="empty-library-state">
                                        <span className="empty-icon">🎙️</span>
                                        <p>No saved mock interview reports found. Complete a practice interview first!</p>
                                        <button onClick={() => nav('/interview')} className="action-link-btn">Practice Mock Interview</button>
                                    </div>
                                ) : (
                                    reports.map((item) => {
                                        let strengths = []
                                        let improvements = []
                                        let questionScores = []
                                        try {
                                            strengths = item.strengthsJson ? JSON.parse(item.strengthsJson) : []
                                            improvements = item.improvementsJson ? JSON.parse(item.improvementsJson) : []
                                            questionScores = item.questionScoresJson ? JSON.parse(item.questionScoresJson) : []
                                        } catch (e) {
                                            console.error("JSON parsing error for report scorecard:", e)
                                        }

                                        return (
                                            <div key={item.id} className="library-card">
                                                <div className="card-header-icon">🎙️</div>
                                                <h3>{item.jobTitle || 'Mock Interview'}</h3>
                                                <div className="card-score-badge">{item.score}% Overall</div>
                                                <p className="card-meta">Difficulty: <span className="capitalize">{item.difficulty}</span></p>
                                                <p className="card-meta">Questions Answered: {questionScores.length}</p>
                                                <div className="card-actions-row">
                                                    <button onClick={() => handlePrint('report', item)} className="card-action-btn print-btn">
                                                        🖨️ Print / PDF
                                                    </button>
                                                    <button onClick={() => downloadJSON(item, `${item.jobTitle || 'interview'}_report.json`)} className="card-action-btn download-json-btn">
                                                        💾 JSON
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Print only template container (renders print target when print is triggered) */}
            {printTarget && (
                <div className="print-only-container">
                    {printTarget.type === 'resume' && (
                        <div className="resume-print-sheet">
                            <h1 className="print-name">{printTarget.data.fullName || 'YOUR NAME'}</h1>
                            <div className="print-contact-bar">
                                {printTarget.data.email && <span>{printTarget.data.email}</span>}
                                {printTarget.data.phone && <span> • {printTarget.data.phone}</span>}
                                {printTarget.data.address && <span> • {printTarget.data.address}</span>}
                                {printTarget.data.website && <span> • {printTarget.data.website}</span>}
                            </div>

                            {printTarget.data.summary && (
                                <div className="print-section">
                                    <h3 className="print-section-title">Professional Summary</h3>
                                    <p className="print-section-body">{printTarget.data.summary}</p>
                                </div>
                            )}

                            {printTarget.data.experienceJson && JSON.parse(printTarget.data.experienceJson).length > 0 && (
                                <div className="print-section">
                                    <h3 className="print-section-title">Work Experience</h3>
                                    {JSON.parse(printTarget.data.experienceJson).map((exp, index) => (
                                        <div key={index} className="print-item">
                                            <div className="print-item-header">
                                                <strong>{exp.jobTitle}</strong>
                                                <span>{exp.duration}</span>
                                            </div>
                                            <div className="print-item-sub">{exp.company}</div>
                                            {exp.details && <p className="print-item-details">{exp.details}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {printTarget.data.education && JSON.parse(printTarget.data.education).length > 0 && (
                                <div className="print-section">
                                    <h3 className="print-section-title">Education</h3>
                                    {JSON.parse(printTarget.data.education).map((edu, index) => (
                                        <div key={index} className="print-item">
                                            <div className="print-item-header">
                                                <strong>{edu.degree}</strong>
                                                <span>{edu.year}</span>
                                            </div>
                                            <div className="print-item-sub">{edu.school}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {printTarget.data.skillsJson && (
                                <div className="print-section">
                                    <h3 className="print-section-title">Skills</h3>
                                    <div className="print-skills">
                                        {printTarget.data.skillsJson.split(',').map((skill, idx) => (
                                            <span key={idx} className="print-skill-tag">{skill.trim()}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {printTarget.data.projectsJson && JSON.parse(printTarget.data.projectsJson).length > 0 && (
                                <div className="print-section">
                                    <h3 className="print-section-title">Projects</h3>
                                    {JSON.parse(printTarget.data.projectsJson).map((proj, index) => (
                                        <div key={index} className="print-item">
                                            <div className="print-item-header">
                                                <strong>{proj.title}</strong>
                                                <span>{proj.tech}</span>
                                            </div>
                                            {proj.description && <p className="print-item-details">{proj.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {printTarget.type === 'report' && (() => {
                        let strengths = []
                        let improvements = []
                        let questionScores = []
                        try {
                            strengths = printTarget.data.strengthsJson ? JSON.parse(printTarget.data.strengthsJson) : []
                            improvements = printTarget.data.improvementsJson ? JSON.parse(printTarget.data.improvementsJson) : []
                            questionScores = printTarget.data.questionScoresJson ? JSON.parse(printTarget.data.questionScoresJson) : []
                        } catch (e) {
                            console.error("JSON parsing error inside print template:", e)
                        }

                        return (
                            <div className="report-print-sheet">
                                <h1 className="print-report-title">Mock Interview Scorecard</h1>
                                <div className="print-report-header">
                                    <div><strong>Job Role:</strong> {printTarget.data.jobTitle}</div>
                                    <div><strong>Difficulty:</strong> {printTarget.data.difficulty}</div>
                                    <div className="print-report-score"><strong>Overall Score:</strong> {printTarget.data.score}%</div>
                                </div>

                                <div className="print-section">
                                    <h3 className="print-section-title">Key Strengths</h3>
                                    <ul className="print-bullets">
                                        {strengths.map((str, idx) => <li key={idx}>✅ {str}</li>)}
                                    </ul>
                                </div>

                                <div className="print-section">
                                    <h3 className="print-section-title">Areas for Improvement</h3>
                                    <ul className="print-bullets">
                                        {improvements.map((imp, idx) => <li key={idx}>💡 {imp}</li>)}
                                    </ul>
                                </div>

                                <div className="print-section">
                                    <h3 className="print-section-title">Detailed Q&A Breakdown</h3>
                                    {questionScores.map((qs, index) => (
                                        <div key={index} className="print-qa-item">
                                            <div className="print-qa-header">
                                                <strong>Q{index + 1}: {qs.question}</strong>
                                                <span className="print-qa-score">Score: {qs.score}/10</span>
                                            </div>
                                            <p><strong>Your Answer:</strong> {qs.answer || '[No Answer]'}</p>
                                            <p><strong>Feedback:</strong> {qs.critique}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })()}
                </div>
            )}
        </div>
    )
}

export default Library
