import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AtsChecker.css'
import ThemeToggle from './ThemeToggle'

const AtsChecker = () => {
    const nav = useNavigate()
    const [resumeList, setResumeList] = useState([])
    const [selectedResumeId, setSelectedResumeId] = useState('upload')
    const [pdfFile, setPdfFile] = useState(null)
    const [jobDescription, setJobDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [activeTab, setActiveTab] = useState('keywords')

    const [scanCount, setScanCount] = useState(0)
    const [isPremium, setIsPremium] = useState(false)
    
    useEffect(()=>{
        const fetchUsage = async()=>{
            const userString = localStorage.getItem('user')
            const user = userString ? JSON.parse(userString) : null
            if(user && user.id)
            {
                setIsPremium(user.premium || false)
                try{
                    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/usage/${user.id}`)
                    if(response.ok)
                    {
                        const data = await response.json()
                        setScanCount(data.atsScansCount||0)
                    }
                }
                catch(err)
                {
                    console.log("Usage fetch failed:",err)
                }
            }
        }
        fetchUsage()
    },[])
    useEffect(() => {
        const fetchResume = async () => {
            const userString = localStorage.getItem('user')
            const loggedUser = userString ? JSON.parse(userString) : null
            if (loggedUser && loggedUser.id) {
                try {
                    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/resume/get/${loggedUser.id}`)
                    if (response.ok) {
                        const data = await response.json()
                        setResumeList(data || [])
                    }
                    else {
                        console.error('Error fetching resumes:', response.statusText)
                    }
                }
                catch (error) {
                    console.error('Error fetching resumes:', error)
                }
            }
        }
        fetchResume()
    }, [])

    const extractTextFromPdf = async (file) => {
        const fileReader = new FileReader()
        return new Promise((resolve, reject) => {
            fileReader.onload = async (e) => {
                const typedArray = new Uint8Array(e.target.result)
                try {
                    if (!window.pdfjsLib) {
                        reject(new Error("PDF parsing library is not loaded. Check your Internet Connection."))
                        return
                    }
                    const pdf = await window.pdfjsLib.getDocument(typedArray).promise
                    let fullText = ""
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i)
                        const textContent = await page.getTextContent()
                        const pageText = textContent.items.map(item => item.str).join(" ")
                        fullText += pageText + "\n"
                    }
                    resolve(fullText)
                }
                catch (err) {
                    reject(err)
                }
            }
            fileReader.onerror = () => reject(fileReader.error)
            fileReader.readAsArrayBuffer(file)
        })
    }

    const runAnalysis = async (e) => {
        e.preventDefault()
        if (!isPremium && scanCount >= 100) {
            alert("You have reached the free limit of 100 ATS scans. Please buy Premium on the dashboard!");
            nav('/home');
            return;
        }
        if (!jobDescription.trim()) {
            alert("Please paste a Job Description to analyze.")
            return
        }
        setLoading(true)
        setResult(null)
        try {
            let resumeText = ""
            if (selectedResumeId === 'upload') {
                if (!pdfFile) {
                    alert('Please select a PDF resume file to upload.')
                    setLoading(false)
                    return
                }
                resumeText = await extractTextFromPdf(pdfFile)
            }
            else {
                const selectedResume = resumeList.find(r => r.id === parseInt(selectedResumeId, 10))
                if (selectedResume) {
                    resumeText = `
                    Name: ${selectedResume.fullName}
                    Email: ${selectedResume.email}
                    Phone: ${selectedResume.phone}
                    Address: ${selectedResume.address}
                    Website: ${selectedResume.website}
                    Summary: ${selectedResume.summary}
                    Skills: ${selectedResume.skillsJson}
                    Experience: ${selectedResume.experienceJson}
                    Projects: ${selectedResume.projectsJson}
                    Education: ${selectedResume.education}
                    Certifications: ${selectedResume.certificationsJson}                    
                    `
                }
            }

            const prompt = `You are an expert ATS (Applicant Tracking System) recruiter. Analyze the candidate's resume text against the provided job description.
                
                Return a JSON object containing exactly these keys:
                - "score" (an integer from 0 to 100 representing how well the resume matches the requirements)
                - "matchedKeywords" (an array of strings showing matching skills, tools, or qualifications)
                - "missingKeywords" (an array of strings showing skills/tools requested in the job description that are missing from the resume)
                - "formattingTips" (an array of strings containing actionable feedback for resume improvement)
                - "optimizedResume" (a JSON object representing a fully rewritten, high-scoring, ATS-optimized version of the candidate's resume. Incorporate the missing keywords naturally into the summary, skills, and experience details. Preserve original details like graduation year and job duration.)
                   It must contain exactly these sub-keys:
                   * "fullName" (string)
                   * "email" (string)
                   * "phone" (string)
                   * "address" (string)
                   * "website" (string)
                   * "summary" (string, rewritten incorporating missing keywords)
                   * "skills" (string, comma-separated listing tech skills including missing keywords)
                   * "experiences" (array of objects with "jobTitle", "company", "duration", "details" keys. Rewrite details to naturally weave in missing keywords)
                   * "educations" (array of objects with "degree", "school", "year" keys)
                   * "projects" (array of objects with "title", "tech", "description" keys)
                
                Return ONLY the raw JSON object. Do not wrap it in markdown block quotes (like \`\`\`json).
                
                --- RESUME ---
                ${resumeText}
                
                --- JOB DESCRIPTION ---
                ${jobDescription}
            `

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }]
                    })
                }
            )

            if (response.ok) {
                const data = await response.json()
                const rawText = data.candidates[0].content.parts[0].text
                const cleanedJson = rawText.replace(/```json|```/g, '').trim()
                const parsedJson = JSON.parse(cleanedJson)
                setResult(parsedJson)

                const userString = localStorage.getItem('user');
            const loggedUser = userString ? JSON.parse(userString) : null;
            if (loggedUser && loggedUser.id) {
                const incRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/increment-ats/${loggedUser.id}`, {
                    method: 'POST'
                });
                if (incRes.ok) {
                    const updatedUser = await incRes.json();
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    setScanCount(updatedUser.atsScansCount);
                }
            }
        }
            else {
                const errdata = await response.json()
                alert(`API Error: ${errdata.error?.message || response.statusText}`)
            }
        }
        catch (error) {
            console.error(error)
            alert("An error occurred during analysis. Please try again later.")
        }
        finally {
            setLoading(false)
        }
    }

    const handleDownloadOptimized = () => {
        window.print()
    }

    return (
        <>
            <div className="ats-container no-print">
                <nav className="navbar">
                    <div className="nav-logo" onClick={() => nav('/home')} style={{ cursor: 'pointer' }}>
                        JobSeek<span className="brand-dot"></span>
                    </div>
                    <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ThemeToggle />
                        <button onClick={() => nav('/home')} className="back-button">Back to Dashboard</button>
                    </div>
                </nav>
                <div className="ats-workspace">
                    <form onSubmit={runAnalysis} className="ats-form-panel">
                        <h2>ATS Resume Analyzer</h2>
                        <p className="subtitle-text">Scan your resume against a job description using Google Gemini AI.</p>
                        
                        <div className="ats-input-group">
                            <label className="ats-label">Choose Resume Source</label>
                            <select
                                value={selectedResumeId}
                                onChange={(e) => setSelectedResumeId(e.target.value)}
                                className="ats-select"
                            >
                                <option value="upload">Upload Custom PDF Resume</option>
                                {resumeList.map(res => (
                                    <option key={res.id} value={res.id}>
                                        {res.fullName || 'Unnamed Resume'} (ID: {res.id})
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {selectedResumeId === 'upload' && (
                            <div className="ats-input-group">
                                <label className="ats-label">Upload Resume File (PDF only)</label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setPdfFile(e.target.files[0])}
                                    className="ats-file-input"
                                />
                            </div>
                        )}
                        
                        <div className="ats-input-group">
                            <label className="ats-label">Paste Job Description</label>
                            <textarea
                                placeholder="Paste the job requirements or description details here..."
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                className="ats-textarea"
                                rows="10"
                                required
                            ></textarea>
                        </div>
                        
                        <button type="submit" className="analyze-submit-btn" disabled={loading}>
                            {loading ? 'Analyzing with Gemini AI...' : 'Analyze Match Score'}
                        </button>
                    </form>
                    
                    <div className="ats-results-panel">
                        {loading && (
                            <div className="ats-loading-view">
                                <div className="spinner"></div>
                                <p>Gemini AI is reading your resume and comparing requirements...</p>
                            </div>
                        )}
                        
                        {!loading && !result && (
                            <div className="ats-empty-view">
                                <div className="analysis-icon">🤖</div>
                                <h3>Awaiting Analysis</h3>
                                <p>Fill out the job description on the left to see your keyword compatibility score.</p>
                            </div>
                        )}
                        
                        {!loading && result && (
                            <div className="ats-results-view">
                                <div className="score-summary-card">
                                    <div className="score-circle-wrapper">
                                        <svg className="score-svg" viewBox="0 0 36 36">
                                            <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                            <path className="circle-fill" strokeDasharray={`${result.score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        </svg>
                                        <div className="score-value">{result.score}%</div>
                                    </div>
                                    <div className="score-assessment">
                                        <h3>
                                            {result.score >= 80 ? 'Excellent Match!' : result.score >= 50 ? 'Moderate Match' : 'Weak Compatibility'}
                                        </h3>
                                        <p>Based on keyword analysis and layout audits.</p>
                                    </div>
                                </div>
                                
                                <div className="result-tabs-bar">
                                    <button className={activeTab === 'keywords' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('keywords')}>Keyword Audit</button>
                                    <button className={activeTab === 'formatting' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('formatting')}>Formatting & Content</button>
                                    {result.optimizedResume && (
                                        <button className={activeTab === 'optimized' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('optimized')}>AI Optimized CV</button>
                                    )}
                                </div>
                                
                                <div className="tab-contents">
                                    {activeTab === 'keywords' && (
                                        <div className="keywords-tab-view">
                                            <h4>Matched Keywords ({result.matchedKeywords?.length || 0})</h4>
                                            <div className="keyword-chips-grid">
                                                {result.matchedKeywords?.map((kw, i) => (
                                                    <span key={i} className="chip match-chip">{kw}</span>
                                                ))}
                                                {(!result.matchedKeywords || result.matchedKeywords.length === 0) && <p className="empty-text">No matching keywords found.</p>}
                                            </div>
                                            
                                            <h4 style={{ marginTop: '24px' }}>Missing Core Keywords ({result.missingKeywords?.length || 0})</h4>
                                            <p className="tips-subtext">Add these skills/tools to your resume text to pass automated filters:</p>
                                            <div className="keyword-chips-grid">
                                                {result.missingKeywords?.map((kw, i) => (
                                                    <span key={i} className="chip missing-chip">{kw}</span>
                                                ))}
                                                {(!result.missingKeywords || result.missingKeywords.length === 0) && <p className="success-text">🎉 No missing keywords! Excellent job.</p>}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {activeTab === 'formatting' && (
                                        <div className="formatting-tab-view">
                                            <h4>Audit Checklist Results</h4>
                                            <ul className="audit-checklist-list">
                                                {result.formattingTips?.map((tip, i) => (
                                                    <li key={i} className="checklist-item">
                                                        <span className="bullet-icon">💡</span>
                                                        <span className="tip-text">{tip}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {activeTab === 'optimized' && result.optimizedResume && (
                                        <div className="optimized-tab-view">
                                            <div className="optimized-download-header">
                                                <p>Here is your new ATS-Optimized resume. We naturally added your missing skills: <strong>{result.missingKeywords?.join(', ')}</strong>.</p>
                                                <button type="button" onClick={handleDownloadOptimized} className="download-optimized-btn">
                                                    Download PDF
                                                </button>
                                            </div>
                                            
                                            <div className="resume-sheet screen-preview">
                                                <div className="resume-header">
                                                    <h1 className="resume-name">{result.optimizedResume.fullName || 'Candidate Name'}</h1>
                                                    <div className="resume-contact-bar">
                                                        {result.optimizedResume.email && <span>{result.optimizedResume.email}</span>}
                                                        {result.optimizedResume.phone && <span> • {result.optimizedResume.phone}</span>}
                                                        {result.optimizedResume.address && <span> • {result.optimizedResume.address}</span>}
                                                        {result.optimizedResume.website && <span> • {result.optimizedResume.website}</span>}
                                                    </div>
                                                </div>
                                                {result.optimizedResume.summary && (
                                                    <div className="resume-section">
                                                        <h4 className="resume-section-title">Professional Summary</h4>
                                                        <p className="resume-section-body">{result.optimizedResume.summary}</p>
                                                    </div>
                                                )}
                                                {result.optimizedResume.experiences && result.optimizedResume.experiences.length > 0 && (
                                                    <div className="resume-section">
                                                        <h4 className="resume-section-title">Work Experience</h4>
                                                        {result.optimizedResume.experiences.map((exp, index) => (
                                                            <div key={index} className="resume-item">
                                                                <div className="resume-item-header">
                                                                    <strong className="resume-item-title">{exp.jobTitle}</strong>
                                                                    <span className="resume-item-duration">{exp.duration}</span>
                                                                </div>
                                                                <div className="resume-item-sub">{exp.company}</div>
                                                                {exp.details && <p className="resume-item-details">{exp.details}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {result.optimizedResume.educations && result.optimizedResume.educations.length > 0 && (
                                                    <div className="resume-section">
                                                        <h4 className="resume-section-title">Education</h4>
                                                        {result.optimizedResume.educations.map((edu, index) => (
                                                            <div key={index} className="resume-item">
                                                                <div className="resume-item-header">
                                                                    <strong className="resume-item-title">{edu.degree}</strong>
                                                                    <span className="resume-item-duration">{edu.year}</span>
                                                                </div>
                                                                <div className="resume-item-sub">{edu.school}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {result.optimizedResume.skills && (
                                                    <div className="resume-section">
                                                        <h4 className="resume-section-title">Skills</h4>
                                                        <div className="resume-skills-grid">
                                                            {result.optimizedResume.skills.split(',').map((skill, index) => (
                                                                <span key={index} className="resume-skill-tag">{skill.trim()}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {result.optimizedResume.projects && result.optimizedResume.projects.length > 0 && (
                                                    <div className="resume-section">
                                                        <h4 className="resume-section-title">Projects</h4>
                                                        {result.optimizedResume.projects.map((proj, index) => (
                                                            <div key={index} className="resume-item">
                                                                <div className="resume-item-header">
                                                                    <strong className="resume-item-title">{proj.title}</strong>
                                                                    <span className="resume-item-duration text-secondary">{proj.tech}</span>
                                                                </div>
                                                                {proj.description && <p className="resume-item-details">{proj.description}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden Print-Only A4 Page Sheet (Sibling of ats-container, not a child) */}
            {result && result.optimizedResume && (
                <div className="print-sheet-optimized">
                    <div className="resume-header">
                        <h1 className="resume-name">{result.optimizedResume.fullName || 'Candidate Name'}</h1>
                        <div className="resume-contact-bar">
                            {result.optimizedResume.email && <span>{result.optimizedResume.email}</span>}
                            {result.optimizedResume.phone && <span> • {result.optimizedResume.phone}</span>}
                            {result.optimizedResume.address && <span> • {result.optimizedResume.address}</span>}
                            {result.optimizedResume.website && <span> • {result.optimizedResume.website}</span>}
                        </div>
                    </div>
                    {result.optimizedResume.summary && (
                        <div className="resume-section">
                            <h4 className="resume-section-title">Professional Summary</h4>
                            <p className="resume-section-body">{result.optimizedResume.summary}</p>
                        </div>
                    )}
                    {result.optimizedResume.experiences && result.optimizedResume.experiences.length > 0 && (
                        <div className="resume-section">
                            <h4 className="resume-section-title">Work Experience</h4>
                            {result.optimizedResume.experiences.map((exp, index) => (
                                <div key={index} className="resume-item">
                                    <div className="resume-item-header">
                                        <strong className="resume-item-title">{exp.jobTitle}</strong>
                                        <span className="resume-item-duration">{exp.duration}</span>
                                    </div>
                                    <div className="resume-item-sub">{exp.company}</div>
                                    {exp.details && <p className="resume-item-details">{exp.details}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                    {result.optimizedResume.educations && result.optimizedResume.educations.length > 0 && (
                        <div className="resume-section">
                            <h4 className="resume-section-title">Education</h4>
                            {result.optimizedResume.educations.map((edu, index) => (
                                <div key={index} className="resume-item">
                                    <div className="resume-item-header">
                                        <strong className="resume-item-title">{edu.degree}</strong>
                                        <span className="resume-item-duration">{edu.year}</span>
                                    </div>
                                    <div className="resume-item-sub">{edu.school}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {result.optimizedResume.skills && (
                        <div className="resume-section">
                            <h4 className="resume-section-title">Skills</h4>
                            <div className="resume-skills-grid">
                                {result.optimizedResume.skills.split(',').map((skill, index) => (
                                    <span key={index} className="resume-skill-tag">{skill.trim()}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {result.optimizedResume.projects && result.optimizedResume.projects.length > 0 && (
                        <div className="resume-section">
                            <h4 className="resume-section-title">Projects</h4>
                            {result.optimizedResume.projects.map((proj, index) => (
                                <div key={index} className="resume-item">
                                    <div className="resume-item-header">
                                        <strong className="resume-item-title">{proj.title}</strong>
                                        <span className="resume-item-duration text-secondary">{proj.tech}</span>
                                    </div>
                                    {proj.description && <p className="resume-item-details">{proj.description}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    )
}

export default AtsChecker
