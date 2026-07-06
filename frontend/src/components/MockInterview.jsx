import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './MockInterview.css'

const MockInterview = () => {
    const nav = useNavigate()
    const [jobTitle, setJobTitle] = useState('')
    const [jobDescription, setJobDescription] = useState('')
    const [difficulty, setDifficulty] = useState('beginner') // beginner, intermediate, hard
    const [resumeList, setResumeList] = useState([])
    const [selectedResumeId, setSelectedResumeId] = useState('none')
    const [isInterviewActive, setIsInterviewActive] = useState(false)
    const [loading, setLoading] = useState(false)
    const [setupMode, setSetupMode] = useState('manual') // manual, upload
    const [uploadedFile, setUploadedFile] = useState(null)

    // Chat room states
    const [messages, setMessages] = useState([])
    const [currentQuestion, setCurrentQuestion] = useState('')
    const [questionCount, setQuestionCount] = useState(0)

    // 30-Minute Timer (1800 seconds)
    const [timeLeft, setTimeLeft] = useState(1800)

    // Voice states
    const [isListening, setIsListening] = useState(false)
    const [voiceTranscript, setVoiceTranscript] = useState('')
    const [speechSupported, setSpeechSupported] = useState(false)

    // Final evaluation state
    const [finalReport, setFinalReport] = useState(null)

    // Refs for speech API and scrolling
    const recognitionRef = useRef(null)
    const chatEndRef = useRef(null)

    // Auto-scroll logic
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

    // Timer countdown effect
    useEffect(() => {
        let timer = null
        if (isInterviewActive && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1)
            }, 1000)
        } else if (timeLeft === 0 && isInterviewActive) {
            handleEndInterview() // End interview when time runs out
        }
        return () => clearInterval(timer)
    }, [isInterviewActive, timeLeft])

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
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final += event.results[i][0].transcript
                    } else {
                        interim += event.results[i][0].transcript
                    }
                }
                setVoiceTranscript(final || interim)
            }

            rec.onerror = (e) => {
                console.error("Speech Recognition Error:", e)
                setIsListening(false)
            }

            rec.onend = () => {
                setIsListening(false)
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
            const defaultVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural')) || voices.find(v => v.lang.startsWith('en'))
            if (defaultVoice) {
                utterance.voice = defaultVoice
            }
            
            window.speechSynthesis.speak(utterance)
        }
    }

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s < 10 ? '0' : ''}${s}`
    }

    const toggleListening = () => {
        if (!speechSupported) {
            alert("Speech recognition is not supported in this browser. Please use Google Chrome or Edge.")
            return
        }

        if (isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        } else {
            setVoiceTranscript('')
            try {
                recognitionRef.current.start()
                setIsListening(true)
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
                    throw new Error("Failed to contact Gemini to parse the job description.")
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

        // Formulate First Question Prompt based on Difficulty
        let difficultyInstruction = ""
        if (difficulty === 'beginner') {
            difficultyInstruction = `The candidate is a GRADUATE/FRESHER with no professional experience.
                Focus your technical questions on core programming languages, basic tools, technologies, and SPECIFICALLY on the projects they completed as listed in their resume:
                --- CANDIDATE RESUME ---
                ${resumeDetails}`
        } else if (difficulty === 'intermediate') {
            difficultyInstruction = `The candidate is an INTERMEDIATE developer.
                Ask technical questions about framework internals, code optimization, database schema relationships, and a few basic project-related questions from their resume:
                --- CANDIDATE RESUME ---
                ${resumeDetails}`
        } else {
            difficultyInstruction = `The candidate is an EXPERIENCED developer. Ask hard, tricky questions about large-scale application architecture, high concurrency troubleshooting, caching strategies, and system design patterns.`
        }

        const prompt = `You are a professional technical interviewer for the role: ${finalJobTitle}.
            Based on this job description: ${finalJobDescription}.
            
            ${difficultyInstruction}
            
            Introduce yourself briefly and ask the first technical interview question. 
            Do not ask general introductory questions like 'tell me about yourself'. Start with a solid technical question.
            
            Return a JSON object containing exactly these keys:
            - "question": "The interview question string"
            
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

                setCurrentQuestion(parsed.question)
                setQuestionCount(1)
                speakText(parsed.question)
            } else {
                alert("Failed to connect to Gemini AI. Check your API key.")
                setIsInterviewActive(false)
            }
        } catch (err) {
            console.error(err)
            alert("Error starting interview.")
            setIsInterviewActive(false)
        } finally {
            setLoading(false)
        }
    }

    // Submit user answer & trigger evaluation + next question
    const submitAnswer = async () => {
        if (!voiceTranscript.trim() && !loading) {
            alert("Please speak or type an answer first!")
            return
        }

        const answerText = voiceTranscript
        setVoiceTranscript('')
        setLoading(true)

        if (isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        }

        // Add user response to active chat timeline
        const updatedMessages = [...messages, { sender: 'user', text: answerText, question: currentQuestion }]
        setMessages(updatedMessages)

        // Formulate prompt with score evaluation
        const prompt = `You are an expert interviewer for the job role: ${jobTitle}.
            We are conducting a technical interview.
            
            Question asked: "${currentQuestion}"
            Candidate answered: "${answerText}"
            
            Evaluate their answer.
            Evaluate their technical accuracy:
            1. Assign a "score" out of 10 (an integer from 0 to 10).
            2. Write a "status": "Correct" if they got it right, "Partial" if they missed details, or "Wrong" if they answered incorrectly or said 'I don't know'.
            3. Write a "critique" describing what was correct or missing.
            4. In "modelAnswer", write a detailed phrasing tip showing how they should have answered to impress recruiters.
            5. In "example", write a simple analogy or real-world example explaining the concept.
            
            Generate the next question based on the job description.
            
            Return a JSON object containing exactly these keys:
            - "feedback": {
                "status": "Correct" | "Partial" | "Wrong",
                "score": integer, 
                "critique": "Constructive simple critique",
                "modelAnswer": "How it should have been said to impress",
                "example": "Simple example/metaphor explaining the concept"
              },
            - "nextQuestion": "The next technical question"
            
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

                // Add interviewer bubble containing the evaluation score
                setMessages(prev => [...prev, { 
                    sender: 'interviewer', 
                    text: `Here is my evaluation for Question #${questionCount}:`,
                    feedback: parsed.feedback 
                }])

                setCurrentQuestion(parsed.nextQuestion)
                setQuestionCount(prev => prev + 1)
                speakText(parsed.nextQuestion)
            }
        } catch (err) {
            console.error(err)
            alert("Error sending answer to interviewer.")
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

    // Force end the interview and generate the comprehensive performance scorecard
    const handleEndInterview = async () => {
        setLoading(true)
        setIsInterviewActive(false)
        if (isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        }

        // Cancel browser voice
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel()
        }

        // Extract all Q&A messages with feedback to compute overall rating
        const qaPairs = messages.filter(m => m.sender === 'user').map((m, idx) => {
            // Find corresponding interviewer response containing the evaluation score
            const correspondingInterviewer = messages.find((v, i) => i > messages.indexOf(m) && v.sender === 'interviewer')
            return {
                question: m.question,
                answer: m.text,
                score: correspondingInterviewer?.feedback?.score || 0,
                critique: correspondingInterviewer?.feedback?.critique || 'No feedback provided.'
            }
        })

        // Calculate average score out of 100 based on individual scores
        const totalScore = qaPairs.reduce((acc, curr) => acc + curr.score, 0)
        const computedScore = qaPairs.length > 0 ? Math.round((totalScore / (qaPairs.length * 10)) * 100) : 0

        // Call Gemini to generate overall Strengths & Improvements based on the interview history
        const prompt = `You are a Lead Tech Recruiter. Compile a final overall assessment of the candidate's interview performance.
            Here is their technical interview Q&A history:
            ${JSON.stringify(qaPairs)}
            
            Write the overall feedback report containing:
            - "strengths" (an array of strings highlighting technical areas they explained well)
            - "improvements" (an array of strings suggesting concepts they need to review or practice)
            
            Return a JSON object containing exactly these keys:
            - "strengths": ["string"],
            - "improvements": ["string"]
            
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
                    score: computedScore,
                    strengths: parsed.strengths,
                    improvements: parsed.improvements,
                    questionScores: qaPairs
                }

                setFinalReport(reportObj)
                speakText("The interview is complete. I have generated your comprehensive evaluation report.")
                
                await saveReportToDb(reportObj)
            }
        } catch (err) {
            console.error("Evaluation summary call failed:", err)
            // Fallback report structure if summary call fails
            const fallbackReport = {
                score: computedScore,
                strengths: ["Completed the voice interview session."],
                improvements: ["Review individual question feedback below."],
                questionScores: qaPairs
            }
            setFinalReport(fallbackReport)
            await saveReportToDb(fallbackReport)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="interview-container">
            <nav className="navbar no-print">
                <div className="nav-logo" onClick={() => nav('/home')} style={{ cursor: 'pointer' }}>
                    JobSeek<span className="brand-dot"></span>
                </div>
                <button onClick={() => nav('/home')} className="back-button">Back to Dashboard</button>
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
                            </select>
                        </div>

                        {setupMode === 'upload' ? (
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
                        ) : (
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
                <div className="interview-workspace no-print">
                    <div className="chat-log-panel">
                        <div className="chat-header">
                            <div>
                                <h3>Interview Room: {jobTitle} ({difficulty})</h3>
                                <span className={`timer-tag ${timeLeft < 120 ? 'timer-danger' : ''}`}>
                                    ⏱️ Time Left: {formatTime(timeLeft)}
                                </span>
                            </div>
                            <button onClick={handleEndInterview} className="end-interview-action-btn">
                                End Interview & Get Report
                            </button>
                        </div>
                        
                        <div className="chat-messages-container">
                            {messages.map((msg, index) => (
                                <div key={index} className={`chat-bubble-row ${msg.sender}`}>
                                    <div className="bubble-avatar">{msg.sender === 'user' ? 'ME' : 'AI'}</div>
                                    <div className="chat-bubble">
                                        {msg.question && <p className="origin-question"><strong>Q:</strong> {msg.question}</p>}
                                        <p>{msg.text}</p>
                                        
                                        {msg.feedback && (
                                            <div className={`feedback-evaluation-card status-${msg.feedback.status?.toLowerCase()}`}>
                                                <div className="evaluation-status-bar">
                                                    <strong>Evaluation: {msg.feedback.status} ({msg.feedback.score}/10)</strong>
                                                </div>
                                                <p className="eval-critique"><strong>Critique:</strong> {msg.feedback.critique}</p>
                                                <p className="eval-model"><strong>How to Impress:</strong> {msg.feedback.modelAnswer}</p>
                                                {msg.feedback.example && (
                                                    <p className="eval-example"><strong>Simple Metaphor/Example:</strong> {msg.feedback.example}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="chat-bubble-row interviewer">
                                    <div className="bubble-avatar">AI</div>
                                    <div className="chat-bubble loading-bubble">
                                        <div className="typing-dots">
                                            <span></span><span></span><span></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Voice controls */}
                        <div className="chat-controls-bar">
                            <div className="voice-visualizer">
                                {isListening && (
                                    <div className="waveform">
                                        <span className="wave-bar"></span>
                                        <span className="wave-bar"></span>
                                        <span className="wave-bar"></span>
                                        <span className="wave-bar"></span>
                                    </div>
                                )}
                                <span className="visualizer-status">
                                    {isListening ? 'Interviewer is listening to your answer...' : 'Microphone is muted.'}
                                </span>
                            </div>

                            <div className="active-question-display">
                                <strong>Question:</strong> {currentQuestion}
                            </div>

                            <div className="transcript-box-wrapper">
                                <textarea 
                                    placeholder="Click the microphone and start speaking your answer, or type it here..."
                                    value={voiceTranscript}
                                    onChange={(e) => setVoiceTranscript(e.target.value)}
                                    className="transcript-textarea"
                                    rows="3"
                                ></textarea>
                            </div>

                            <div className="controls-buttons-group">
                                <button 
                                    onClick={toggleListening} 
                                    className={`mic-toggle-btn ${isListening ? 'active' : ''}`}
                                    type="button"
                                >
                                    {isListening ? '🎙️ Stop Listening' : '🎙️ Tap to Speak'}
                                </button>
                                <button 
                                    onClick={submitAnswer} 
                                    className="submit-answer-btn"
                                    disabled={loading}
                                    type="button"
                                >
                                    Submit Answer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Performance Evaluation Dashboard */}
            {finalReport && !isInterviewActive && (
                <div className="interview-report-panel">
                    <h2>Mock Interview Performance Report</h2>
                    <p className="subtitle">Rating score and question feedback for the role of {jobTitle} ({difficulty})</p>
                    
                    <div className="report-card">
                        <div className="overall-score-section">
                            <div className="large-score-circle">{finalReport.score}%</div>
                            <h3>Overall Score</h3>
                        </div>
                        
                        <div className="strengths-improvements-section">
                            <div className="report-list-box">
                                <h4>Key Strengths</h4>
                                <ul>
                                    {finalReport.strengths?.map((str, i) => (
                                        <li key={i}>✅ {str}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="report-list-box" style={{ marginTop: '16px' }}>
                                <h4>Recommended Improvements</h4>
                                <ul>
                                    {finalReport.improvements?.map((imp, i) => (
                                        <li key={i}>💡 {imp}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Question-by-Question Detailed Report Section */}
                    <div className="detailed-qa-report-section">
                        <h3>Detailed Questions Breakdown ({finalReport.questionScores?.length} asked)</h3>
                        <div className="qa-breakdown-list">
                            {finalReport.questionScores?.map((qa, index) => (
                                <div key={index} className="qa-report-item">
                                    <div className="qa-report-header">
                                        <span className="qa-number">Q{index + 1}</span>
                                        <span className="qa-score-badge">Score: {qa.score}/10</span>
                                    </div>
                                    <p className="qa-question-text"><strong>Question:</strong> {qa.question}</p>
                                    <p className="qa-answer-text"><strong>Your Answer:</strong> {qa.answer || '[No spoken answer submitted]'}</p>
                                    <p className="qa-feedback-text"><strong>Coaching Advice:</strong> {qa.critique}</p>
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
