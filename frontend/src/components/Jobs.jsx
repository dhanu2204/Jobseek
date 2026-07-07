import React from 'react'
import { useState ,useEffect} from 'react'
import "./Jobs.css"
import { useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

const Jobs = () => {
    const [searchQuery,setSearchQuery]=useState('')
    const [jobs,setJobs]=useState([])
    const [loading,setloading] = useState(false)

    const [filteredJobs,setFilteredJobs] = useState([])
    const[selectedJobType,setSelectedJobType] = useState('all')
    const[selectedLocation,setSelectedLocation]=useState('all')
    const[selectedWorkMode,setSelectedWorkMode]=useState('all')
    const[selectedExperience,setSelectedExperience]=useState('all')
    const[selectedSalary,setSelectedSalary]=useState('all')
    const nav = useNavigate()

    useEffect(()=>{
        fetchJobs('')
    },[])

    useEffect(()=>
    {
     let result = jobs
     if(selectedJobType !== 'all')
     {
         result = result.filter(job=>job.job_type === selectedJobType)
     }   
    if(selectedLocation !== 'all')
    {
        result = result.filter(job=>
        {
            const loc = (job.candidate_required_location||'').toLowerCase()
            return loc.includes(selectedLocation)
        })
    }
    if (selectedWorkMode !== 'all') {
            result = result.filter(job => {
                const loc = (job.candidate_required_location || '').toLowerCase()
                const isWorldwide = loc === '' || loc.includes('worldwide') || loc.includes('anywhere')
                
                if (selectedWorkMode === 'worldwide') {
                    return isWorldwide
                } else if (selectedWorkMode === 'regional') {
                    return !isWorldwide
                }
                return true
            })
    }
    if(selectedExperience !== 'all')
    {
        result = result.filter(job=>{
            const title = job.title.toLowerCase()
            const desc = job.description.toLowerCase().substring(0,300)
            const searchScope = title+" "+desc
            const level = selectedExperience

            const isJunior = searchScope.includes('junior')||searchScope.includes('entry')||searchScope.includes('intern')||searchScope.includes('graduate')||searchScope.includes('assistant')||searchScope.includes('trainee')||searchScope.includes('apprentice')||searchScope.includes('new grad')||searchScope.includes('early career')
            const isSenior = searchScope.includes('senior')||searchScope.includes('lead')||searchScope.includes('principal')||searchScope.includes('staff')||searchScope.includes('director')||searchScope.includes('VP')||searchScope.includes('executive')
            const isMid = searchScope.includes('mid')||searchScope.includes('mid-level')

            if(level === 'entry')
            {
                return isJunior || !isSenior && !isMid
            }
            else if(level === 'mid')
            {
                return isMid
            }
            else if(level === 'senior')
            {
                return isSenior
            }
        })
    }
    if (selectedSalary !== 'all') {
            result = result.filter(job => {
                if (!job.salary) return false 
                if (selectedSalary === 'has_info') return true
                const numbersOnly = job.salary.replace(/[^0-9]/g, '')
                if (!numbersOnly) return false
                let salaryVal = parseInt(numbersOnly, 10)
                
                if (salaryVal < 1000) {
                    salaryVal = salaryVal * 2000 
                }
                if (selectedSalary === 'over_50k') {
                    return salaryVal >= 50000
                } else if (selectedSalary === 'over_100k') {
                    return salaryVal >= 100000
                }
                return true
            })
        }
        setFilteredJobs(result)
    },[jobs,selectedJobType,selectedLocation,selectedWorkMode,selectedExperience,selectedSalary])
    
    const fetchJobs = async(query) =>
    {
        setloading(true)
        try{
            const url = query ?`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`:'https://remotive.com/api/remote-jobs?limit=30'
            const response = await fetch(url)
            if(response.ok){
                const data = await response.json()
                setJobs(data.jobs || [])
            }
            else{
                console.error("Failed to load jobs",response.statusText)
            }
        }
        catch(err)
        {
            console.error("Error fetching jobs",err.message)
        }
        finally{
            setloading(false)
        }
    }

    const handleSearchSubmit = (e) =>
    {
        e.preventDefault()
        fetchJobs(searchQuery)
    }

        const handleApply = async (job) => {

        const userString = localStorage.getItem('user');
        const loggedUser = userString ? JSON.parse(userString) : null;
        if(!loggedUser || !loggedUser.id)
        {
            alert('You must be logged in to apply for a job')
            nav('/login')
            return;
        }
        const applicationData = {
            externalJobId: job.id,
            jobTitle: job.title,
            companyName: job.company_name,
            jobUrl: job.url,
            status: 'Applied',
            userId: {
                id: loggedUser.id
            }  
        };
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/application/`, {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(applicationData)
            });
            
            if (response.ok) {
                const resText = await response.text();
                alert(`you are applying for ${job.title} at ${job.company_name}`);
                
                window.open(job.url, '_blank');
            }
            else {
                alert('Failed to apply for job');
            }
        }
        catch (error) {
            console.error('Error applying for job:', error);
            alert('Failed to apply for job');
        }
    };


   return (
    <div className='jobs-container'>
         <nav className='navbar'>
             <div className='nav-logo' onClick={() => nav('/home')} style={{ cursor: 'pointer' }}>
                 JobSeek<span className="brand-dot"></span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <ThemeToggle />
                 <button onClick={() => nav('/home')} className="back-button">Back To Dashboard</button>
             </div>
         </nav>
        <div className='search-section'>
            <h1 className='search-title'>Explore Remote Tech Jobs</h1>
            <form onSubmit={handleSearchSubmit} className='search-form'>
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Search Job Title, Skill...' 
                    className='search-input'
                />
                <button type='submit' className='search-button'>Search Jobs</button>
            </form>

             <div className='filters-section'>
                {/* Job Type Filter */}
                <div className='filter-group'>
                    <label className='filter-label'>Job Type</label>
                    <select value={selectedJobType} onChange={(e) => setSelectedJobType(e.target.value)} className='filter-select'>
                        <option value="all">All Types</option>
                        <option value="full_time">Full-Time</option>
                        <option value="part_time">Part-Time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                    </select>
                </div>

                {/* Location Filter */}
                <div className='filter-group'>
                    <label className='filter-label'>Location</label>
                    <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className='filter-select'>
                        <option value="all">Any Location</option>
                        <option value="us">USA</option>
                        <option value="europe">Europe</option>
                        <option value="uk">UK</option>
                        <option value="canada">Canada</option>
                        <option value="asia">Asia</option>
                    </select>
                </div>

                {/* Work Mode Filter */}
                <div className='filter-group'>
                    <label className='filter-label'>Work Mode</label>
                    <select value={selectedWorkMode} onChange={(e) => setSelectedWorkMode(e.target.value)} className='filter-select'>
                        <option value="all">All Modes</option>
                        <option value="worldwide">Worldwide</option>
                        <option value="regional">Regional</option>
                    </select>
                </div>

                {/* Experience Filter */}
                <div className='filter-group'>
                    <label className='filter-label'>Experience Level</label>
                    <select value={selectedExperience} onChange={(e) => setSelectedExperience(e.target.value)} className='filter-select'>
                        <option value="all">All Levels</option>
                        <option value="entry">Entry Level</option>
                        <option value="mid">Mid Level</option>
                        <option value="senior">Senior Level</option>
                    </select>
                </div>

                {/* Salary Filter */}
                <div className='filter-group'>
                    <label className='filter-label'>Salary Range</label>
                    <select value={selectedSalary} onChange={(e) => setSelectedSalary(e.target.value)} className='filter-select'>
                        <option value="all">Any Salary</option>
                        <option value="has_info">Has Salary Info</option>
                        <option value="over_50k">$50k+</option>
                        <option value="over_100k">$100k+</option>
                    </select>
                </div>
            </div>
        </div>
        {loading && <div className='loading-spinner'>Searching live listings...</div>}
        {!loading && (
            <div className='jobs-grid'>
                {filteredJobs.length === 0 ? (
                    <p className='no-jobs'>
                        No Jobs Found. Try searching for something else!
                    </p>
                ) : (
                    filteredJobs.map(job => (
                        <div key={job.id} className='job-card'>
                            <div className='job-header'>
                                {job.company_logo && (
                                    <img src={job.company_logo} alt={job.company_name} className='company-logo-img' />
                                )}
                                <div>
                                    <h3 className='job-title-text'>{job.title}</h3>
                                    <p className='job-company-name'>{job.company_name}</p>
                                </div>
                            </div>

                            <div className='job-details'>
                                <span className='job-tag'>{job.candidate_required_location || 'Remote'}</span>
                                <span className='job-tag'>{job.job_type}</span>
                                {job.salary && <span className='job-salary'>{job.salary}</span>}
                            </div>
                            <div 
                                className='job-description-preview' 
                                dangerouslySetInnerHTML={{ __html: job.description.substring(0, 100) + '...' }} 
                            />
                            <button onClick={() => handleApply(job)} className='job-apply-button'>
                                Apply Now
                            </button>
                        </div>
                    ))
                )}
            </div>
        )}
    </div>
  )
}

export default Jobs