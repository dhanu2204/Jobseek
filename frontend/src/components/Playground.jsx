import React,{useState,useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import Editor from '@monaco-editor/react'
import './Playground.css'


const Playground = () => {
    const nav = useNavigate()
    const [topic,setTopic] = useState('Arrays')
    const [difficulty,setDifficulty] = useState('easy')
    const [currentProblem,setCurrentProblem] = useState(null)
    const [generating, setGenerating] = useState(false)
    const [language,setLanguage] = useState('javascript')
    const [userCodes, setUserCodes] = useState({
        javascript : '',
        python : '',
        java : '',
    })
    const [consoleLogs, setConsoleLogs] = useState([])
    const [testResults,setTestResults] = useState([])
    const [executing,setExecuting] = useState(false)
    const [aiHint,setAiHint] = useState('')
    const [loadingHint,setLoadingHint] = useState(false)
    const [solvedSuccess, setSolvedSuccess] = useState(false);

    const saveSolvedChallengeToDB = async () => {
    const userString = localStorage.getItem('user')
    const loggedUser = userString ? JSON.parse(userString) : null
    if (!loggedUser || !loggedUser.id) return

    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/challenge/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                problemTitle: currentProblem.title,
                language: language,
                userId: { id: loggedUser.id }
            })
        })
        if (response.ok) {
            const message = await response.text()
            if (message === "Challenge saved successfully") {
                setSolvedSuccess(true)
                // Auto-hide alert after 4 seconds
                setTimeout(() => setSolvedSuccess(false), 4000)
            }
        }
    } catch (error) {
        console.error("Error saving challenge:", error)
    }
}


    const handleGenerateChallenge = async (e) => {
        e.preventDefault()
        if(!topic.trim())
        {
            alert('Please specify a topic or concept')
            return
        }
        setGenerating(true)
        setCurrentProblem(null)
        setConsoleLogs([])
        setTestResults([])
        setAiHint('')
        
        const prompt = `Create a single programming coding challenge about the topic: "${topic}" with difficulty level: "${difficulty}".
            
            Return a JSON object containing exactly these keys:
            - "title": "A clean title for the problem",
            - "description": "Clear description of what the function needs to accomplish and any input/output constraints.",
            - "examples": [
                { "input": "string representing example input", "output": "string representing example output" }
              ],
            - "templates": {
                "javascript": "starting code template function (e.g. function solve(str) { return ''; })",
                "python": "starting code template function (e.g. def solve(s: str) -> str:)"
              },
            - "jsFunctionName": "exact name of the JavaScript function to run",
            - "pyFunctionName": "exact name of the Python function to run",
            - "testCases": [
                { "input": "input argument (string, number, list, or array of arguments)", "expected": "expected output data structure" },
                { "input": "input argument", "expected": "expected output" },
                { "input": "input argument", "expected": "expected output" }
              ]
              
            Return ONLY the raw JSON object. Do not include markdown wraps (like \`\`\`json).`

            try{
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
                    {method: 'POST',
                        headers:{
                            'Content-Type':'application/json'
                        },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                        })
                    }
                )
                if(response.ok)
                {
                    const data = await response.json()
                    const rawText = data.candidates[0].content.parts[0].text
                    const cleanJson = rawText.replace(/```json|```/g,'').trim()
                    const parsed = JSON.parse(cleanJson)
                    setCurrentProblem(parsed)
                    setUserCodes({
                        javascript: parsed.templates.javascript || "",
                        python : parsed.templates.python || "",
                        java : parsed.templates.java || "",
                    })
                }
                else{
                    alert('Failed to create a Problem Statement')
                }
            }
            catch(err)
            {
                console.log(err)
                alert("Error generating challange")
            }
            finally{
                setGenerating(false)
            }
    }

    const handleCodeChange = (value) =>{
        setUserCodes(prev =>({...prev,[language]: value}))
    }

    const handleRunCode = async()=>{
        if(!currentProblem)return
        setExecuting(true)
        setConsoleLogs([])
        setTestResults([])
        setAiHint('')

        const activeCode = userCode[language]

         if (language === 'javascript') {
            const logs = []
            const originalLog = console.log
            console.log = (...args) => {
                logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '))
            }
            try {
                const evalCode = `
                    ${activeCode}
                    
                    return (function() {
                        const results = [];
                        const testCases = ${JSON.stringify(currentProblem.testCases)};
                        for (let i = 0; i < testCases.length; i++) {
                            const tc = testCases[i];
                            try {
                                let actual;
                                // Handle single or multiple inputs
                                if (Array.isArray(tc.input)) {
                                    actual = ${currentProblem.jsFunctionName}(...tc.input);
                                } else {
                                    actual = ${currentProblem.jsFunctionName}(tc.input);
                                }
                                
                                const passed = JSON.stringify(actual) === JSON.stringify(tc.expected);
                                results.push({
                                    index: i + 1,
                                    input: JSON.stringify(tc.input),
                                    expected: JSON.stringify(tc.expected),
                                    actual: JSON.stringify(actual),
                                    passed
                                });
                            } catch (e) {
                                results.push({
                                    index: i + 1,
                                    input: JSON.stringify(tc.input),
                                    expected: JSON.stringify(tc.expected),
                                    actual: "Error: " + e.message,
                                    passed: false
                                });
                            }
                        }
                        return results;
                    })()
                `
                const run = new Function(evalCode)
                const outcome = run()
                console.log = originalLog
                setConsoleLogs(logs) 
                setTestResults(outcome || [])
                
                const allPassed = outcome && outcome.length > 0 && outcome.every(tr => tr.passed)
                if (allPassed) {
                    saveSolvedChallengeToDB()
                }
            }
            catch(err){
                console.log = originalLog
                setConsoleLogs([`Compilation Error: ${err.message}`])
                setTestResults([])       
            }
            finally{
                setExecuting(false)
            }
        }
    else if (language === 'python') {
            const prompt = `You are a sandboxed Python 3 execution engine.
                Execute this candidate code:
                \`\`\`python
                ${activeCode}
                \`\`\`
                
                Evaluate the function "${currentProblem.pyFunctionName}" against these test cases:
                ${JSON.stringify(currentProblem.testCases)}
                
                If the code contains syntax errors or throws an exception, capture it in "errorMessage".
                Otherwise, run the code and check if the return values match the expected output data types.
                
                Return a JSON object containing exactly these keys:
                - "consoleLogs": ["array of print output statements during execution"],
                - "testResults": [
                    {
                      "index": integer,
                      "input": "input value string",
                      "expected": "expected output string",
                      "actual": "actual output string",
                      "passed": true or false
                    }
                  ],
                - "errorMessage": "Error logs (blank if successfully executed)"
                
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
                    if (parsed.errorMessage) {
                        setConsoleLogs([parsed.errorMessage])
                        setTestResults([])
                    } else {
                        setConsoleLogs(parsed.consoleLogs || [])
                        setTestResults(parsed.testResults || [])
const allPassed = parsed.testResults && parsed.testResults.length > 0 && parsed.testResults.every(tr => tr.passed)
if (allPassed) {
    saveSolvedChallengeToDB()
}

                    }
                } else {
                    setConsoleLogs(["Failed to connect to the cloud execution sandbox."])
                }
            } catch (err) {
                console.error(err)
                setConsoleLogs([`Execution error: ${err.message}`])
            } finally {
                setExecuting(false)
            }
        }
        else{
            const prompt = `You are a sandboxed Java 21 execution environment.
                    Execute this candidate code:
                    \`\`\`java
                    ${activeCode}
                    \`\`\`
                    
                    Evaluate the function "${currentProblem.javaFunctionName}" against these test cases:
                    ${JSON.stringify(currentProblem.testCases)}
                    
                    If the code contains syntax errors or throws an exception, capture it in "errorMessage".
                    Otherwise, run the code and check if the return values match the expected output data types.
                    
                    Return a JSON object containing exactly these keys:
                    - "consoleLogs": ["array of print output statements during execution"],
                    - "testResults": [
                        {
                        "index": integer,
                        "input": "input value string",
                        "expected": "expected output string",
                        "actual": "actual output string",
                        "passed": true or false
                        }
                    ],
                    - "errorMessage": "Error logs (blank if successfully executed)"
                    
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
                    if (parsed.errorMessage) {
                        setConsoleLogs([parsed.errorMessage])
                        setTestResults([])
                    } else {
                        setConsoleLogs(parsed.consoleLogs || [])
                        setTestResults(parsed.testResults || [])
                        const allPassed = parsed.testResults && parsed.testResults.length > 0 && parsed.testResults.every(tr => tr.passed)
                        if (allPassed) {
                            saveSolvedChallengeToDB()
                        }
                    }
                } else {
                    setConsoleLogs(["Failed to connect to the cloud execution sandbox."])
                }
            } catch (err) {
                console.error(err)
                setConsoleLogs([`Execution error: ${err.message}`])
            } finally {
                setExecuting(false)
            }
        }
    }

    const handleAskAi = async()=>{
        if(!currentProblem)return
        setLoadingHint(true)
        setAiHint('')
        const activeCode = userCodes[language]
        const prompt = `You are a supportive technical code coach helping a student solve this problem:
            Problem Title: ${currentProblem.title}
            Problem Description: ${currentProblem.description}
            Programming Language: ${language}
            
            The user has written this code in the editor:
            \`\`\`${language}
            ${activeCode}
            \`\`\`
            
            Look at their code. Identify any syntax mistakes, logic bugs, or unhandled cases.
            Provide:
            1. An analysis of what is correct or wrong (without spelling out the complete solution).
            2. A simple explanation of the issue.
            3. 1 or 2 hints to guide them to fix it themselves.
            
            Be brief, highly educational, and use simple language. Format with bold titles.`
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
                const hintText = data.candidates[0].content.parts[0].text
                setAiHint(hintText)
            } else {
                setAiHint("Failed to contact the AI Code Coach. Please check your API key.")
            }
        } catch (error) {
            console.error(error)
            setAiHint("Error communicating with AI Code Coach.")
        } finally {
            setLoadingHint(false)
        }
    }


return (
        <div className="playground-container">
            <nav className="navbar">
                <div className="nav-logo" onClick={() => nav('/home')} style={{ cursor: 'pointer' }}>
                    JobSeek<span className="brand-dot"></span>
                </div>
                <button onClick={() => nav('/home')} className="back-button">Back to Dashboard</button>
            </nav>
            <div className="playground-workspace">
                {/* Left Column - Configuration & Problem details */}
                <div className="problem-panel">
                    {!currentProblem && (
                        <div className="generator-setup-card">
                            <h3>Configure Coding Challenge</h3>
                            <p className="subtitle-desc">Enter any programming concept to generate a custom problem instantly.</p>
                            
                            <form onSubmit={handleGenerateChallenge} className="setup-form-box">
                                <div className="setup-input-group">
                                    <label>Technical Topic</label>
                                    <input 
                                        type="text" 
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g. Arrays, Recursion, Trees, SQL Queries"
                                        required
                                    />
                                </div>
                                <div className="setup-input-group">
                                    <label>Difficulty</label>
                                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                                        <option value="easy">Easy (Fresher Core)</option>
                                        <option value="medium">Medium (Framework Logic)</option>
                                        <option value="hard">Hard (Advanced Scalability)</option>
                                    </select>
                                </div>
                                <button type="submit" className="gen-btn" disabled={generating}>
                                    {generating ? 'Generating Challenge...' : 'Generate Challenge 🚀'}
                                </button>
                            </form>
                        </div>
                    )}
                    {currentProblem && (
                        <div className="problem-body">
                            <button onClick={() => setCurrentProblem(null)} className="new-challenge-btn">
                                🔄 Generate Another Topic
                            </button>
                            
                            <h2>{currentProblem.title}</h2>
                            <span className={`diff-badge ${difficulty}`}>
                                {difficulty}
                            </span>
                            
                            <h3>Description</h3>
                            <p className="problem-desc">{currentProblem.description}</p>
                            <h3>Examples</h3>
                            <div className="examples-list">
                                {currentProblem.examples?.map((ex, i) => (
                                    <div key={i} className="example-box">
                                        <p><strong>Input:</strong> <code>{ex.input}</code></p>
                                        <p><strong>Output:</strong> <code>{ex.output}</code></p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="editor-panel">
                    <div className="editor-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>Language:</span>
                            <select 
                                value={language} 
                                onChange={(e) => setLanguage(e.target.value)} 
                                className="language-selector"
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                            </select>
                        </div>
                        
                        <div className="editor-actions">
                            <button onClick={handleAskAi} className="coach-btn" disabled={loadingHint || executing || !currentProblem}>
                                💡 Ask AI Code Coach
                            </button>
                            <button onClick={handleRunCode} className="run-btn" disabled={executing || !currentProblem}>
                                {executing ? '⏳ Running...' : '▶️ Run Tests'}
                            </button>
                        </div>
                    </div>
                    <div className="editor-body">
                        {currentProblem ? (
                            <Editor
                                height="100%"
                                language={language === 'javascript' ? 'javascript' : 'python'}
                                theme="vs-dark"
                                value={userCodes[language]}
                                onChange={(value) => handleCodeChange(value || '')}
                                options={{
                                    fontSize: 14,
                                    minimap: { enabled: false },
                                    automaticLayout: true,
                                    fontFamily: 'Consolas, monaco, monospace'
                                }}
                            />
                        ) : (
                            <div className="editor-placeholder-screen">
                                <p>Set up and generate a challenge on the left to start coding.</p>
                            </div>
                        )}
                    </div>
                    {/* Bottom Output Console */}
                    <div className="console-panel">
                        <div className="console-header">Console Output & Test Results</div>
                        <div className="console-body">
                            {consoleLogs.length > 0 && (
                                <div className="logs-section">
                                    <h4>Logs:</h4>
                                    {consoleLogs.map((log, i) => (
                                        <pre key={i} className="log-line">{log}</pre>
                                    ))}
                                </div>
                            )}
                            {testResults.length > 0 ? (
                                <div className="test-results-section">
                                    <h4>Test Cases:</h4>
                                    {testResults.map((tr) => (
                                        <div key={tr.index} className={`test-case-row ${tr.passed ? 'passed' : 'failed'}`}>
                                            <span className="case-status">{tr.passed ? '✅ Passed' : '❌ Failed'}</span>
                                            <span className="case-details">
                                                Test #{tr.index}: Input: <code>{tr.input}</code> | Expected: <code>{tr.expected}</code> | Actual: <code>{tr.actual}</code>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                !executing && consoleLogs.length === 0 && <p className="console-placeholder">Click "Run Tests" to execute your code.</p>
                            )}
                            {executing && <p className="console-placeholder">Executing code...</p>}
                        </div>
                    </div>
                </div>
                {/* Right Column Slide-Out AI Coach */}
                {(loadingHint || aiHint) && (
                    <div className="coach-drawer">
                        <div className="coach-header-row">
                            <h3>AI Code Coach</h3>
                            <button onClick={() => setAiHint('')} className="close-coach-btn">×</button>
                        </div>
                        <div className="coach-body-content">
                            {loadingHint ? (
                                <div className="coach-loading">
                                    <div className="spinner"></div>
                                    <p>AI Coach is analyzing your code...</p>
                                </div>
                            ) : (
                                <div className="coach-text">
                                    {aiHint.split('\n').map((line, i) => (
                                        <p key={i} style={{ margin: '6px 0', fontSize: '13.5px', lineHeight: '1.45' }}>{line}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {solvedSuccess && (
                <div className="solved-success-banner">
                    🎉 Challenge successfully solved! Progress recorded to your profile.
                </div>
            )}

        </div>
    )
}
export default Playground