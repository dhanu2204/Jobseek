import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import './ResumeBuilder.css'
import ThemeToggle from './ThemeToggle'

const ResumeBuilder = () => {
    const nav = useNavigate()
    const [resumeId, setResumeId] = useState(null)
    const [allResumes, setAllResumes] = useState([]) 
    
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        summary: '',
        skillsJson: '',
        education: '',
        experienceJson: '',
        projectsJson: '',
        certificationsJson: ''
    })

    const [experiences, setExperiences] = useState([]);
    const [projects, setProjects] = useState([]);
    const [educations, setEducations] = useState([]);
    const [activeStep, setActiveStep] = useState(1)

    const loadResumeIntoForm = (savedResume) => {
        setResumeId(savedResume.id)
        setFormData({
            fullName: savedResume.fullName || '',
            email: savedResume.email || '',
            phone: savedResume.phone || '',
            address: savedResume.address || '',
            website: savedResume.website || '',
            summary: savedResume.summary || '',
            education: savedResume.education || '',
            experienceJson: savedResume.experienceJson || '',
            skillsJson: savedResume.skillsJson || '',
            projectsJson: savedResume.projectsJson || '',
            certificationsJson: savedResume.certificationsJson || ''
        })
        setExperiences(savedResume.experienceJson ? JSON.parse(savedResume.experienceJson) : [])
        setProjects(savedResume.projectsJson ? JSON.parse(savedResume.projectsJson) : [])
        setEducations(savedResume.education ? JSON.parse(savedResume.education) : [])
    }

    const clearForm = () => {
        setResumeId(null)
        setFormData({
            fullName: '',
            email: '',
            phone: '',
            address: '',
            website: '',
            summary: '',
            education: '',
            experienceJson: '',
            skillsJson: '',
            projectsJson: '',
            certificationsJson: ''
        })
        setExperiences([])
        setProjects([])
        setEducations([])
    }

    const fetchAllResumes = async () => {
        const userString = localStorage.getItem('user')
        const loggedUser = userString ? JSON.parse(userString) : null
        if (!loggedUser || !loggedUser.id) {
            alert('Please Log in first!')
            nav('/login')
            return
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/resume/get/${loggedUser.id}`)
            if (response.ok) {
                const list = await response.json()
                setAllResumes(list || [])
                
                if (list && list.length > 0 && !resumeId) {
                    loadResumeIntoForm(list[0])
                }
            }
        }
        catch (error) {
            console.error("Error while fetching resumes", error)
        }
    }

    useEffect(() => {
        fetchAllResumes()
    }, [nav])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSelectChange = (e) => {
        const val = e.target.value
        if (val === 'new') {
            clearForm()
        } else {
            const selected = allResumes.find(r => r.id === parseInt(val, 10))
            if (selected) {
                loadResumeIntoForm(selected)
            }
        }
    }

    const handleDelete = async () => {
        if (!resumeId) return
        if (!window.confirm("Are you sure you want to delete this resume?")) return

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/resume/delete/${resumeId}`, {
                method: 'DELETE'
            })
            if (response.ok) {
                alert("Resume deleted successfully!")
                clearForm()
                fetchAllResumes() // Refresh list
            } else {
                alert("Failed to delete resume.")
            }
        } catch (error) {
            console.error("Error deleting resume:", error)
        }
    }

    const addExperience = () => {
        setExperiences([...experiences, { jobTitle: '', company: '', duration: '', details: '' }])
    }
    const updateExperience = (index, field, value) => {
        const updated = [...experiences]
        updated[index][field] = value
        setExperiences(updated)
    }
    const removeExperience = (index) => {
        setExperiences(experiences.filter((_, i) => i !== index))
    }

    const addEducation = () => {
        setEducations([...educations, { degree: '', school: '', year: '' }])
    }
    const updateEducation = (index, field, value) => {
        const updated = [...educations]
        updated[index][field] = value
        setEducations(updated)
    }
    const removeEducation = (index) => {
        setEducations(educations.filter((_, i) => i !== index))
    }

    const addProject = () => {
        setProjects([...projects, { title: '', tech: '', description: '' }])
    }
    const updateProject = (index, field, value) => {
        const updated = [...projects]
        updated[index][field] = value
        setProjects(updated)
    }
    const removeProject = (index) => {
        setProjects(projects.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        const userString = localStorage.getItem('user')
        const loggedUser = userString ? JSON.parse(userString) : null
        if (!loggedUser || !loggedUser.id) {
            alert('You must be logged in to save!')
            return
        }

        const isPremium = loggedUser.premium || false;
        if (!resumeId && allResumes.length >= 100 && !isPremium) {
            alert("You have reached the free limit of 100 resumes. Please purchase Premium on the dashboard!");
            nav('/home');
            return;
        }
        const payload = {
            id: resumeId,
            user: {
                id: loggedUser.id
            },
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            website: formData.website,
            summary: formData.summary,
            skillsJson: formData.skillsJson,
            education: JSON.stringify(educations),
            experienceJson: JSON.stringify(experiences),
            projectsJson: JSON.stringify(projects),
            certificationsJson: formData.certificationsJson
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/resume/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            if (response.ok) {
                const saved = await response.json()
                setResumeId(saved.id)
                alert('Resume saved successfully!')
                fetchAllResumes() // Refresh list to show updated name
            } else {
                alert('Failed to save resume.')
            }
        } catch (error) {
            console.error('Error saving resume:', error)
            alert('Error connecting to backend server.')
        }
    }

    const handleDownloadPDF = () => {
        window.print()
    }

    return (
        <div className='resume-builder-container'>
            <nav className='navbar no-print'>
                <div className='nav-logo' onClick={() => nav('/home')} style={{ cursor: 'pointer' }}>
                    JobSeek<span className='brand-dot'></span>
                </div>
                <div className='nav-actions' style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ThemeToggle />
                    <button onClick={handleSave} className='save-button'>Save Resume</button>
                    <button onClick={handleDownloadPDF} className='download-button'>Download Resume</button>
                    <button onClick={() => nav('/home')} className='back-button'>Back to Dashboard</button>
                </div>
            </nav>
            <div className='builder-workspace'>
                <div className='form-panel no-print'>
                    {/* 3. Resume Selection Controls */}
                    <div className="resume-selector-bar">
                        <select 
                            value={resumeId || 'new'} 
                            onChange={handleSelectChange} 
                            className="resume-select-dropdown"
                        >
                            <option value="new">+ Create New Resume</option>
                            {allResumes.map((res, index) => (
                                <option key={res.id} value={res.id}>
                                    {res.fullName || `Unnamed Resume #${index + 1}`} (ID: {res.id})
                                </option>
                            ))}
                        </select>
                        {resumeId && (
                            <button onClick={handleDelete} className="delete-resume-btn">
                                Delete This Resume
                            </button>
                        )}
                    </div>

                    <div className='step-navigation'>
                        <button className={activeStep === 1 ? 'step-tab active' : 'step-tab'} onClick={() => { setActiveStep(1) }}>1. Contact Info</button>
                        <button className={activeStep === 2 ? 'step-tab active' : 'step-tab'} onClick={() => { setActiveStep(2) }}>2. Experience</button>
                        <button className={activeStep === 3 ? 'step-tab active' : 'step-tab'} onClick={() => { setActiveStep(3) }}>3. Education</button>
                        <button className={activeStep === 4 ? 'step-tab active' : 'step-tab'} onClick={() => { setActiveStep(4) }}>4. Skills & Projects</button>
                    </div>
                    <div className='form-content'>
                        {activeStep === 1 && (
                            <div className='form-step-group'>
                                <h3>Personal Information</h3>
                                <input type="text" name='fullName' placeholder='Full Name' value={formData.fullName} onChange={handleChange} className='form-input' />
                                <input type="email" name='email' placeholder='Email Address' value={formData.email} onChange={handleChange} className='form-input' />
                                <input type="text" name='phone' placeholder='Phone Number' value={formData.phone} onChange={handleChange} className='form-input' />
                                <input type="text" name='address' placeholder='Address' value={formData.address} onChange={handleChange} className='form-input' />
                                <input type="text" name='website' placeholder='Website' value={formData.website} onChange={handleChange} className='form-input' />
                                <h3 className='mt-4'>Professional Summary</h3>
                                <textarea name='summary' placeholder='Summary' value={formData.summary} onChange={handleChange} className='form-textarea' rows="5"></textarea>
                            </div>
                        )}
                        {activeStep === 2 && (
                            <div className='form-step-group'>
                                <div className='section-header'>
                                    <h3>Work Experience</h3>
                                    <button onClick={addExperience} className='add-list-item-btn'>+ Add Experience</button>
                                </div>
                                {experiences.map((exp, index) => (
                                    <div key={index} className='list-item-card'>
                                        <input type="text" placeholder='Job Title' value={exp.jobTitle} onChange={(e) => updateExperience(index, 'jobTitle', e.target.value)} className='form-input' />
                                        <input type="text" placeholder='Company' value={exp.company} onChange={(e) => updateExperience(index, 'company', e.target.value)} className='form-input' />
                                        <input type="text" placeholder='Duration (e.g. 2022 - 2023)' value={exp.duration} onChange={(e) => updateExperience(index, 'duration', e.target.value)} className='form-input' />
                                        <textarea placeholder='Description / Key accomplishments' value={exp.details} onChange={(e) => updateExperience(index, 'details', e.target.value)} className='form-textarea' rows="3"></textarea>
                                        <button onClick={() => removeExperience(index)} className='remove-item-btn'>- Remove Experience</button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeStep === 3 && (
                            <div className="form-step-group">
                                <div className="section-header">
                                    <h3>Education</h3>
                                    <button onClick={addEducation} className="add-list-item-btn">+ Add School</button>
                                </div>
                                {educations.map((edu, index) => (
                                    <div key={index} className="list-item-card">
                                        <input type="text" placeholder="Degree / Course Name (e.g. B.Tech Computer Science)" value={edu.degree} onChange={(e) => updateEducation(index, 'degree', e.target.value)} className="form-input" />
                                        <input type="text" placeholder="School / University Name" value={edu.school} onChange={(e) => updateEducation(index, 'school', e.target.value)} className="form-input" />
                                        <input type="text" placeholder="Graduation Year (e.g. 2024)" value={edu.year} onChange={(e) => updateEducation(index, 'year', e.target.value)} className="form-input" />
                                        <button onClick={() => removeEducation(index)} className="remove-item-btn">Delete Education</button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeStep === 4 && (
                            <div className="form-step-group">
                                <h3>Technical & Core Skills</h3>
                                <input type="text" name="skillsJson" placeholder="Skills (comma-separated, e.g. Java, React, SQL, AWS)" value={formData.skillsJson} onChange={handleChange} className="form-input" />
                                <div className="section-header" style={{ marginTop: '24px' }}>
                                    <h3>Projects</h3>
                                    <button onClick={addProject} className="add-list-item-btn">+ Add Project</button>
                                </div>
                                {projects.map((proj, index) => (
                                    <div key={index} className="list-item-card">
                                        <input type="text" placeholder="Project Title" value={proj.title} onChange={(e) => updateProject(index, 'title', e.target.value)} className="form-input" />
                                        <input type="text" placeholder="Technologies Used (e.g. Spring Boot, MySQL)" value={proj.tech} onChange={(e) => updateProject(index, 'tech', e.target.value)} className="form-input" />
                                        <textarea placeholder="Short description of what the project does..." value={proj.description} onChange={(e) => updateProject(index, 'description', e.target.value)} className="form-textarea" rows="3"></textarea>
                                        <button onClick={() => removeProject(index)} className="remove-item-btn">Delete Project</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="preview-panel">
                    <div className="resume-sheet print-sheet" id="resume-sheet">
                        <div className="resume-header">
                            <h1 className="resume-name">{formData.fullName || 'YOUR NAME'}</h1>
                            <div className="resume-contact-bar">
                                {formData.email && <span>{formData.email}</span>}
                                {formData.phone && <span> • {formData.phone}</span>}
                                {formData.address && <span> • {formData.address}</span>}
                                {formData.website && <span> • <a href={formData.website} target="_blank" rel="noreferrer" className="resume-link">{formData.website}</a></span>}
                            </div>
                        </div>
                        {formData.summary && (
                            <div className="resume-section">
                                <h4 className="resume-section-title">Professional Summary</h4>
                                <p className="resume-section-body">{formData.summary}</p>
                            </div>
                        )}
                        {experiences.length > 0 && (
                            <div className="resume-section">
                                <h4 className="resume-section-title">Work Experience</h4>
                                {experiences.map((exp, index) => (
                                    <div key={index} className="resume-item">
                                        <div className="resume-item-header">
                                            <strong className="resume-item-title">{exp.jobTitle || 'Job Title'}</strong>
                                            <span className="resume-item-duration">{exp.duration}</span>
                                        </div>
                                        <div className="resume-item-sub">{exp.company || 'Company Name'}</div>
                                        {exp.details && <p className="resume-item-details">{exp.details}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                        {educations.length > 0 && (
                            <div className="resume-section">
                                <h4 className="resume-section-title">Education</h4>
                                {educations.map((edu, index) => (
                                    <div key={index} className="resume-item">
                                        <div className="resume-item-header">
                                            <strong className="resume-item-title">{edu.degree || 'Degree'}</strong>
                                            <span className="resume-item-duration">{edu.year}</span>
                                        </div>
                                        <div className="resume-item-sub">{edu.school || 'School/University'}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {formData.skillsJson && (
                            <div className="resume-section">
                                <h4 className="resume-section-title">Skills</h4>
                                <div className="resume-skills-grid">
                                    {formData.skillsJson.split(',').map((skill, index) => (
                                        <span key={index} className="resume-skill-tag">{skill.trim()}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {projects.length > 0 && (
                            <div className="resume-section">
                                <h4 className="resume-section-title">Projects</h4>
                                {projects.map((proj, index) => (
                                    <div key={index} className="resume-item">
                                        <div className="resume-item-header">
                                            <strong className="resume-item-title">{proj.title || 'Project Title'}</strong>
                                            <span className="resume-item-duration text-secondary">{proj.tech}</span>
                                        </div>
                                        {proj.description && <p className="resume-item-details">{proj.description}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ResumeBuilder
