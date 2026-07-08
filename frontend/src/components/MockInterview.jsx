import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './MockInterview.css'
import ThemeToggle from './ThemeToggle'

const MockInterview = () => {
    const nav = useNavigate()
    const [jobTitle, setJobTitle] = useState('')
    const [jobDescription, setJobDescription] = useState('')
    const [difficulty, setDifficulty] = useState('beginner') 
    const [resumeList, setResumeList] = useState([])
    const [selectedResumeId, setSelectedResumeId] = useState('none')
    const [isInterviewActive, setIsInterviewActive] = useState(false)
    const [loading, setLoading] = useState(false)
    const [setupMode, setSetupMode] = useState('manual') 
    const [uploadedFile, setUploadedFile] = useState(null)
    const [customFocus, setCustomFocus] = useState('')

    // Batch states
    const [questionsList, setQuestionsList] = useState([])
    const [answers, setAnswers] = useState([])
    const [activeMicIndex, setActiveMicIndex] = useState(null)

    // Voice states
    const [isListening, setIsListening] = useState(false)
    const [speechSupported, setSpeechSupported] = useState(false)

    // Final evaluation state
    const [finalReport, setFinalReport] = useState(null)
    const [interviewsCount, setInterviewsCount] = useState(0)
    const [isPremium, setIsPremium] = useState(false)

    // Refs for speech API and scrolling
    const recognitionRef = useRef(null)
    const shouldBeListeningRef = useRef(false)
    const accumulatedTranscriptRef = useRef('')
    const voiceTranscriptRef = useRef('')
    const activeMicIndexRef = useRef(null)
    const answersRef = useRef([])

    // Auto-scroll logic
    useEffect(() => {
        const fetchUsage = async () => {
            const userString = localStorage.getItem('user')
            const user = userString ? JSON.parse(userString) : null
            if (user && user.id) {
                setIsPremium(user.premium || false)
                try {
                    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/usage/${user.id}`)
                    if (response.ok) {
                        const data = await response.json()
                        setInterviewsCount(data.interviewsCount || 0)
                    }
                } catch (err) {
                    console.error("Usage fetch failed:", err)
                }
            }
        }
        fetchUsage()
    }, [])
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, currentQuestion])

    // Load saved resumes list on mount to allow project questions
    useEffect(() => {
        const fetchResumes = async () => {
            const userString = localStorage.getItem('user')
            const loggedUser = userString ? JSON.parse(userString) : null
            if (loggedUser && loggedUser.id) {
                try {
                    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/resume/get/${loggedUser.id}`)
                    if (response.ok) {
                        const data = await response.json()
                        setResumeList(data || [])
                    }
                } catch (error) {
                    console.error("Error loading resumes for interview setup:", error)
                }
            }
        }
        fetchResumes()
    }, [])

    // Timer countdown disabled (runs until ended manually)
    useEffect(() => {
        // Countdown timer has been removed per request
    }, [isInterviewActive])

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognition) {
            setSpeechSupported(true)
            const rec = new SpeechRecognition()
            rec.continuous = true
            rec.interimResults = true
            rec.lang = 'en-US'

            rec.onresult = (event) => {
                let interim = ''
                let final = ''
                for (let i = 0; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final += event.results[i][0].transcript + ' '
                    } else {
                        interim += event.results[i][0].transcript
                    }
                }
                const newText = (accumulatedTranscriptRef.current + ' ' + final + interim).trim().replace(/\s+/g, ' ')
                
                const idx = activeMicIndexRef.current
                if (idx !== null) {
                    const newAnswers = [...answersRef.current]
                    newAnswers[idx] = newText
                    answersRef.current = newAnswers
                    setAnswers(newAnswers)
                    voiceTranscriptRef.current = newText
                }
            }

            rec.onerror = (e) => {
                console.error("Speech Recognition Error:", e)
                if (e.error === 'not-allowed') {
                    shouldBeListeningRef.current = false
                    activeMicIndexRef.current = null
                    setActiveMicIndex(null)
                    setIsListening(false)
                }
            }

            rec.onend = () => {
                if (shouldBeListeningRef.current) {
                    accumulatedTranscriptRef.current = voiceTranscriptRef.current
                    setTimeout(() => {
                        if (shouldBeListeningRef.current) {
                            try {
                                rec.start()
                            } catch (err) {
                                console.error("Auto-restart mic failed:", err)
                            }
                        }
                    }, 800)
                } else {
                    setIsListening(false)
                    setActiveMicIndex(null)
                    activeMicIndexRef.current = null
                }
            }

            recognitionRef.current = rec
        }
    }, [])

    // Text-to-Speech Utterance Reader
    const speakText = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel()
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.rate = 1.0
            utterance.pitch = 1.0
            
            const voices = window.speechSynthesis.getVoices()
            const maleVoice = voices.find(v => v.lang.startsWith('en') && 
                (v.name.toLowerCase().includes('male') || 
                 v.name.toLowerCase().includes('david') || 
                 v.name.toLowerCase().includes('guy') || 
                 v.name.toLowerCase().includes('microsoft david'))) 
                || voices.find(v => v.lang.startsWith('en'))
            if (maleVoice) {
                utterance.voice = maleVoice
            }
            
            window.speechSynthesis.speak(utterance)
        }
    }

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s < 10 ? '0' : ''}${s}`
    }

    const toggleListening = (idx) => {
        if (!speechSupported) {
            alert("Speech recognition is not supported in this browser. Please use Google Chrome or Edge.")
            return
        }

        if (activeMicIndexRef.current === idx) {
            // Stop listening
            shouldBeListeningRef.current = false
            activeMicIndexRef.current = null
            setActiveMicIndex(null)
            recognitionRef.current.stop()
            setIsListening(false)
        } else {
            // Stop current listening first if active
            if (activeMicIndexRef.current !== null) {
                shouldBeListeningRef.current = false
                recognitionRef.current.stop()
            }
            
            // Start listening for new index
            const currentAnswerText = answersRef.current[idx] || ''
            accumulatedTranscriptRef.current = currentAnswerText
            voiceTranscriptRef.current = currentAnswerText
            
            activeMicIndexRef.current = idx
            setActiveMicIndex(idx)
            shouldBeListeningRef.current = true
            setIsListening(true)
            
            try {
                recognitionRef.current.start()
            } catch (err) {
                console.error("Mic start failed:", err)
            }
        }
    }

    // Read text file contents
    const readTextFromFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target.result)
            reader.onerror = () => reject(reader.error)
            reader.readAsText(file)
        })
    }

    // Extract text from PDF using pdfjsLib
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

    // Start Interview Session
    const startInterview = async (e) => {
        e.preventDefault()
         if (!isPremium && interviewsCount >= 100) {
            alert("You have reached the free limit of 100 Mock Interviews. Please purchase Premium on the dashboard!");
            nav('/home');
            return;
        }

        let finalJobTitle = jobTitle
        let finalJobDescription = jobDescription

        setLoading(true)

        if (setupMode === 'upload') {
            if (!uploadedFile) {
                alert("Please upload a PDF or TXT job description file.")
                setLoading(false)
                return
            }
            try {
                let fileText = ""
                if (uploadedFile.name.toLowerCase().endsWith('.pdf')) {
                    fileText = await extractTextFromPdf(uploadedFile)
                } else {
                    fileText = await readTextFromFile(uploadedFile)
                }

                if (!fileText.trim()) {
                    throw new Error("The uploaded file seems to be empty.")
                }

                // Call Gemini to extract job role and description
                const extractPrompt = `You are an AI assistant. Analyze the following job description document text:
                    "${fileText}"
                    
                    Extract:
                    1. The Target Job Role / Job Title (concise, e.g. "Software Engineer", "Java Backend Developer").
                    2. A clean, detailed summary of the responsibilities, technologies, and requirements.
                    
                    Return a JSON object containing exactly these keys:
                    - "jobTitle": "Job Title",
                    - "jobDescription": "Detailed requirements/responsibilities"
                    
                    Return ONLY the raw JSON object. Do not include markdown wraps (like \`\`\`json).`

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: extractPrompt }] }] })
                    }
                )

                if (!response.ok) {
                    if (response.status === 429) {
                        throw new Error("Google Gemini API rate limit reached (429 Too Many Requests). Please wait 1 minute for the rate limit to reset and try starting again.")
                    } else {
                        throw new Error(`Failed to contact Gemini to parse the job description. (Status ${response.status})`)
                    }
                }

                const data = await response.json()
                const rawText = data.candidates[0].content.parts[0].text
                const cleanJson = rawText.replace(/```json|```/g, '').trim()
                const parsedData = JSON.parse(cleanJson)

                finalJobTitle = parsedData.jobTitle || "Uploaded Role"
                finalJobDescription = parsedData.jobDescription || fileText

                setJobTitle(finalJobTitle)
                setJobDescription(finalJobDescription)
            } catch (err) {
                console.error(err)
                alert("Error reading or parsing the uploaded file: " + err.message)
                setLoading(false)
                return
            }
        } else if (setupMode === 'custom') {
            if (!customFocus.trim()) {
                alert("Please enter the Language or Tool you want to be interviewed on.")
                setLoading(false)
                return
            }
            finalJobTitle = `Custom Focus: ${customFocus}`
            finalJobDescription = `Core concepts of ${customFocus}`
            setJobTitle(finalJobTitle)
            setJobDescription(finalJobDescription)
        } else {
            if (!finalJobTitle.trim() || !finalJobDescription.trim()) {
                alert("Please specify the Job Role and Description.")
                setLoading(false)
                return
            }
        }

        setIsInterviewActive(true)
        setMessages([])
        setFinalReport(null)
        setQuestionCount(0)
        setTimeLeft(1800) // Reset 30-minute timer

        // Extract selected resume details
        let resumeDetails = "None provided."
        if (selectedResumeId !== 'none') {
            const saved = resumeList.find(r => r.id === parseInt(selectedResumeId, 10))
            if (saved) {
                resumeDetails = `
                    Skills: ${saved.skillsJson}
                    Summary: ${saved.summary}
                    Projects: ${saved.projectsJson}
                    Experience: ${saved.experienceJson}
                `
            }
        }

        // Formulate Question Generation Prompt based on Difficulty/Custom Setup
        let difficultyInstruction = ""
        if (setupMode === 'custom') {
            difficultyInstruction = `The candidate wants a custom technical focus interview on the language/tool: ${customFocus}. You must ask commonly asked technical interview questions ONLY on the core concepts of ${customFocus}. Do not ask about any other libraries, systems, or project details. Only ask about core concepts of ${customFocus}.`
        } else if (difficulty === 'beginner') {
            difficultyInstruction = `The candidate is a GRADUATE/FRESHER with no professional experience. Focus your technical questions on core programming languages, basic tools, technologies, and SPECIFICALLY on the projects they completed as listed in their resume:
                --- CANDIDATE RESUME ---
                ${resumeDetails}`
        } else if (difficulty === 'intermediate') {
            difficultyInstruction = `The candidate is an INTERMEDIATE developer. Ask technical questions about framework internals, code optimization, database schema relationships, and a few basic project-related questions from their resume:
                --- CANDIDATE RESUME ---
                ${resumeDetails}`
        } else {
            difficultyInstruction = `The candidate is an EXPERIENCED developer. Ask hard, tricky questions about large-scale application architecture, high concurrency troubleshooting, caching strategies, and system design patterns.`
        }

        const prompt = `You are a professional technical interviewer for the role: ${finalJobTitle}.
            Based on this job description: ${finalJobDescription}.
            
            ${difficultyInstruction}
            
            Generate exactly 10 distinct, technical interview questions.
            Do not ask general introductory questions like 'tell me about yourself'. Start directly with solid technical questions.
            
            Return a JSON object containing exactly this key:
            - "questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5", "Question 6", "Question 7", "Question 8", "Question 9", "Question 10"]
            
            Return ONLY the raw JSON object. Do not include markdown wraps (like \`\`\`json).`

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                }
            )

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error("Google Gemini API rate limit reached (429 Too Many Requests). Please wait 1 minute for the rate limit to reset and try starting again.")
                } else {
                    throw new Error(`Failed to contact Gemini to generate questions. (Status ${response.status})`)
                }
            }

            const data = await response.json()
            const rawText = data.candidates[0].content.parts[0].text
            const cleanJson = rawText.replace(/```json|```/g, '').trim()
            const parsedData = JSON.parse(cleanJson)

            const list = parsedData.questions || []
            if (list.length === 0) {
                throw new Error("Failed to parse questions array.")
            }

            setQuestionsList(list)
            
            // Initialize answers array with empty strings for each question
            const emptyAnswers = new Array(list.length).fill('')
            setAnswers(emptyAnswers)
            answersRef.current = emptyAnswers

            setIsInterviewActive(true)
            setFinalReport(null)
            
            const introMsg = "Hello! I am Zoro, your technical interviewer. I have generated 10 questions for your interview session. Please speak or type your answers for each question below, then click Submit Answers at the bottom."
            speakText(introMsg)
        } catch (err) {
            console.error(err)
            alert("Error starting interview: " + err.message)
            setIsInterviewActive(false)
        } finally {
            setLoading(false)
        }
    }

    // Submit all user answers at once & trigger evaluation scorecard report
    const submitAllAnswers = async () => {
        // Stop speech recognition if listening
        if (shouldBeListeningRef.current) {
            shouldBeListeningRef.current = false
            activeMicIndexRef.current = null
            setActiveMicIndex(null)
            recognitionRef.current.stop()
            setIsListening(false)
        }

        setLoading(true)

        // Compile question and answer pairs
        const qaPairs = questionsList.map((q, idx) => ({
            question: q,
            answer: answers[idx] || '[No answer submitted]'
        }))

        // Verify if they answered at least one question
        const hasAnyAnswer = qaPairs.some(qa => qa.answer.trim() && qa.answer !== '[No answer submitted]')
        if (!hasAnyAnswer) {
            alert("Please answer at least one question before submitting!")
            setLoading(false)
            return
        }

        // Formulate evaluation prompt
        const prompt = `You are a professional technical interviewer named Zoro. 
            Evaluate the candidate's answers for the following 10 technical questions for the role: ${jobTitle}.
            
            Here are the questions and candidate's answers:
            ${JSON.stringify(qaPairs)}
            
            For each question:
            1. Assign a "score" out of 10 (an integer from 0 to 10).
            2. Write a "status": "Correct" if they got it right/explained it well, "Partial" if they missed details, or "Wrong" if they answered incorrectly or left it blank.
            3. Write a "critique" describing what was correct or missing in their response.
            4. In "modelAnswer", write a detailed phrasing tip showing how they should have answered to impress recruiters.
            5. In "example", write a simple analogy or real-world example explaining the concept.
            
            Return a JSON object containing exactly these keys:
            - "overallScore": integer (the average score scaled out of 100),
            - "evaluations": [
                {
                  "question": "Question text",
                  "answer": "Candidate's answer",
                  "score": score_integer,
                  "status": "Correct" | "Partial" | "Wrong",
                  "critique": "Constructive simple critique",
                  "modelAnswer": "How it should have been said to impress",
                  "example": "Simple example/metaphor explaining the concept"
                }
              ]
            
            Return ONLY the raw JSON object. Do not include markdown wraps (like \`\`\`json).`

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                }
            )

            if (response.ok) {
                const data = await response.json()
                const rawText = data.candidates[0].content.parts[0].text
                const cleanJson = rawText.replace(/```json|```/g, '').trim()
                const parsed = JSON.parse(cleanJson)

                const reportObj = {
                    score: parsed.overallScore || 0,
                    questionScores: parsed.evaluations || []
                }

                setFinalReport(reportObj)
                setIsInterviewActive(false)
                speakText("Your interview answers have been submitted. I have generated your evaluation scorecard.")

                await saveReportToDb(reportObj)
            } else {
                if (response.status === 429) {
                    alert("Google Gemini rate limit reached (429 Too Many Requests). Please wait 1 minute for the rate limit to reset and click Submit again.")
                } else {
                    alert(`Gemini API Error (Status ${response.status}). Failed to retrieve response. Please try submitting again.`)
                }
            }
        } catch (err) {
            console.error(err)
            alert("Error sending answers to interviewer: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    const saveReportToDb = async (report) => {
        const userString = localStorage.getItem('user')
        const loggedUser = userString ? JSON.parse(userString) : null
        if (!loggedUser || !loggedUser.id) {
            console.warn("User not logged in, cannot save report.")
            return
        }

        try {
            const bodyPayload = {
                userId: { id: loggedUser.id },
                jobTitle: jobTitle || "Mock Interview",
                difficulty: difficulty,
                score: report.score,
                strengthsJson: JSON.stringify(report.strengths || []),
                improvementsJson: JSON.stringify(report.improvements || []),
                questionScoresJson: JSON.stringify(report.questionScores || [])
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/interview-report/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyPayload)
            })

            if (response.ok) {
                console.log("Mock interview report saved successfully to backend database!")
            } else {
                console.error("Failed to save mock interview report to backend database:", response.statusText)
            }
        } catch (err) {
            console.error("Error saving mock interview report:", err)
        }
    }



    return (
        <div className="interview-container">
            <nav className="navbar no-print">
                <div className="nav-logo" onClick={() => nav('/home')} style={{ cursor: 'pointer' }}>
                    JobSeek<span className="brand-dot"></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ThemeToggle />
                    <button onClick={() => nav('/home')} className="back-button">Back to Dashboard</button>
                </div>
            </nav>

            {!isInterviewActive && !finalReport && (
                <div className="interview-setup-panel no-print">
                    <h2>AI Voice Mock Interview</h2>
                    <p className="subtitle">Practice verbal tech interviews with real-time feedback and phrasing coaching.</p>
                    
                    <form onSubmit={startInterview} className="setup-form">
                        <div className="input-group">
                            <label className="ats-label">Interview Setup Option</label>
                            <select 
                                value={setupMode}
                                onChange={(e) => setSetupMode(e.target.value)}
                                className="ats-select"
                            >
                                <option value="manual">Manual Input (Type Role & Paste Job Description)</option>
                                <option value="upload">Upload Job Description File (PDF or TXT)</option>
                                <option value="custom">Custom Focus (Language / Tool)</option>
                            </select>
                        </div>

                        {setupMode === 'upload' && (
                            <div className="input-group">
                                <label className="ats-label">Upload Job Description File (PDF or TXT)</label>
                                <input 
                                    type="file" 
                                    accept=".pdf,.txt" 
                                    onChange={(e) => setUploadedFile(e.target.files[0])}
                                    className="ats-select"
                                    required
                                />
                            </div>
                        )}

                        {setupMode === 'custom' && (
                            <div className="input-group">
                                <label className="ats-label">Target Language or Tool</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Java, Python, React, Docker, SQL" 
                                    value={customFocus}
                                    onChange={(e) => setCustomFocus(e.target.value)}
                                    className="ats-select"
                                    required
                                />
                            </div>
                        )}

                        {setupMode === 'manual' && (
                            <>
                                <div className="input-group">
                                    <label className="ats-label">Target Job Role</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Java Backend Developer, React Engineer" 
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        className="ats-select"
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="ats-label">Paste Job Description</label>
                                    <textarea 
                                        placeholder="Paste the job posting description here to customize technical questions..." 
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        className="ats-textarea"
                                        rows="6"
                                        required
                                    ></textarea>
                                </div>
                            </>
                        )}
                        
                        <div className="input-group">
                            <label className="ats-label">Select Resume (Optional - to scan projects)</label>
                            <select 
                                value={selectedResumeId}
                                onChange={(e) => setSelectedResumeId(e.target.value)}
                                className="ats-select"
                            >
                                <option value="none">Do Not Scan Resume (General Questions)</option>
                                {resumeList.map(res => (
                                    <option key={res.id} value={res.id}>
                                        {res.fullName || 'Unnamed Resume'} (ID: {res.id})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="ats-label">Difficulty Level</label>
                            <select 
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="ats-select"
                            >
                                <option value="beginner">Beginner (Fresher - core concepts & resume projects)</option>
                                <option value="intermediate">Intermediate (Frameworks, coding and optimizations)</option>
                                <option value="hard">Hard (Experienced - system design, concurrency & architecture)</option>
                            </select>
                        </div>

                        <button type="submit" className="start-btn" disabled={loading}>
                            {loading ? 'Starting Room...' : 'Start Voice Interview'}
                        </button>
                    </form>
                </div>
            )}

            {/* Active Interview Workspace */}
            {isInterviewActive && (
                <div className="interview-workspace no-print" style={{ display: 'flex', flexDirection: 'column', height: '80vh', backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px' }}>
                    <div className="questionnaire-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div className="chat-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingBottom: '16px',
                            borderBottom: '1px solid #e2e8f0',
                            marginBottom: '16px'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Interview Session: {jobTitle} ({difficulty})</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                                    Please read and answer the 10 questions generated below. You can either type your answers or tap the mic button on each question to speak them.
                                </p>
                            </div>
                            <button onClick={() => {
                                if (shouldBeListeningRef.current) {
                                    shouldBeListeningRef.current = false
                                    activeMicIndexRef.current = null
                                    setActiveMicIndex(null)
                                    recognitionRef.current.stop()
                                    setIsListening(false)
                                }
                                setIsInterviewActive(false)
                            }} className="end-interview-action-btn" style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                                Cancel & Exit
                            </button>
                        </div>
                        
                        <div className="questionnaire-scroll-area" style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                            {questionsList.map((q, idx) => (
                                <div key={idx} className="question-card" style={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    marginBottom: '20px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}>
                                    <div className="question-card-header" style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '10px'
                                    }}>
                                        <h4 style={{ margin: 0, color: '#1e293b', fontSize: '0.95rem' }}>Question {idx + 1}</h4>
                                        <button
                                            onClick={() => toggleListening(idx)}
                                            className={`mic-toggle-btn ${activeMicIndex === idx ? 'active' : ''}`}
                                            style={{
                                                padding: '6px 12px',
                                                fontSize: '0.8rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                borderRadius: '20px',
                                                border: '1px solid #cbd5e1',
                                                cursor: 'pointer',
                                                backgroundColor: activeMicIndex === idx ? '#ef4444' : '#f8fafc',
                                                color: activeMicIndex === idx ? '#fff' : '#475569',
                                                fontWeight: '500',
                                                transition: 'all 0.2s'
                                            }}
                                            type="button"
                                        >
                                            {activeMicIndex === idx ? '🛑 Stop Dictation' : '🎙️ Tap to Speak'}
                                        </button>
                                    </div>
                                    
                                    <p style={{ margin: '0 0 12px 0', color: '#334155', fontSize: '0.9rem', lineHeight: '1.4', fontWeight: '500' }}>{q}</p>
                                    
                                    {activeMicIndex === idx && (
                                        <div className="waveform-small" style={{ display: 'flex', gap: '3px', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>Recording... Speak now.</span>
                                        </div>
                                    )}

                                    <textarea
                                        placeholder="Type your answer here or tap the microphone to dictate..."
                                        value={answers[idx] || ''}
                                        onChange={(e) => {
                                            const val = e.target.value
                                            const newAnswers = [...answers]
                                            newAnswers[idx] = val
                                            setAnswers(newAnswers)
                                            answersRef.current = newAnswers
                                        }}
                                        style={{
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            padding: '10px',
                                            fontSize: '0.85rem',
                                            minHeight: '80px',
                                            resize: 'vertical',
                                            fontFamily: 'inherit'
                                        }}
                                        rows="3"
                                    ></textarea>
                                </div>
                            ))}
                        </div>

                        <div className="questionnaire-footer" style={{
                            paddingTop: '16px',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px',
                            marginTop: '16px'
                        }}>
                            <button
                                onClick={submitAllAnswers}
                                className="submit-answer-btn"
                                disabled={loading}
                                style={{
                                    padding: '10px 24px',
                                    fontSize: '0.95rem',
                                    backgroundColor: '#4f46e5',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s',
                                    opacity: loading ? 0.7 : 1
                                }}
                                type="button"
                            >
                                {loading ? 'Submitting Answers...' : 'Submit All Answers & Get Report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Performance Evaluation Dashboard */}
            {finalReport && !isInterviewActive && (
                <div className="interview-report-panel">
                    <h2>Mock Interview Performance Report</h2>
                    <p className="subtitle">Rating score and question feedback for the role of {jobTitle} ({difficulty})</p>
                    
                    <div className="report-card" style={{ justifyContent: 'center' }}>
                        <div className="overall-score-section">
                            <div className="large-score-circle">{finalReport.score}%</div>
                            <h3>Overall Score</h3>
                        </div>
                    </div>

                    {/* Question-by-Question Detailed Report Section */}
                    <div className="detailed-qa-report-section">
                        <h3>Detailed Questions Breakdown ({finalReport.questionScores?.length} asked)</h3>
                        <div className="qa-breakdown-list">
                            {finalReport.questionScores?.map((qa, index) => (
                                <div key={index} className="qa-report-item" style={{ marginBottom: '24px' }}>
                                    <div className="qa-report-header">
                                        <span className="qa-number">Q{index + 1}</span>
                                        <span className="qa-score-badge">Score: {qa.score}/10</span>
                                    </div>
                                    <p className="qa-question-text"><strong>Question:</strong> {qa.question}</p>
                                    <p className="qa-answer-text"><strong>Your Answer:</strong> {qa.answer || '[No spoken answer submitted]'}</p>
                                    <p className="qa-feedback-text"><strong>Coaching Advice:</strong> {qa.critique}</p>
                                    {qa.modelAnswer && <p className="qa-feedback-text"><strong>How to Impress:</strong> {qa.modelAnswer}</p>}
                                    {qa.example && <p className="qa-feedback-text"><strong>Simple Metaphor/Example:</strong> {qa.example}</p>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="report-actions no-print">
                        <button onClick={() => setFinalReport(null)} className="retry-btn">
                            Practice Another Interview
                        </button>
                        <button onClick={() => nav('/home')} className="back-home-btn">
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MockInterview
