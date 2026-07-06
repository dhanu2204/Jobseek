import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Register.css' // Import CSS styles

const Register = () => {

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [mobile, setMobile] = useState('')

    const nav = useNavigate()

    const handleSubmit = async(e) => {
        e.preventDefault()

        if(name.trim() === '' || email.trim()===''|| password.trim()===''||mobile.trim()===''|| confirmPassword.trim()==='')
        {
            alert('Please fill in all fields')
            return;
        }
        if(password !== confirmPassword){
            alert('Passwords do not match')
            return;
        }
        const userData = {
            name: name,
            email: email,
            mobile: mobile,
            password: password
        }

        try{
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/register`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            })
            if(response.ok)
            {
                const data = await response.json();
                
                if(!data)
                {
                    alert('Registration failed, Email already exists.');
                }
                else{
                    alert("Registration successful")
                    nav('/login')
                }
            }
        }
        catch(error)
        {
            console.log(error)
            alert('Registration failed, something went wrong'); 
        }
    }

    
  return (
    <div className="auth-container">
        <div className="auth-card">
            <div className="brand-header">
                <div className="brand-logo">JobSeek<span className="brand-dot"></span></div>
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Join the JobSeek portal today</p>
            </div>
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="input-group">
                    <label className="input-label">Full Name</label>
                    <input 
                        type="text" 
                        placeholder="Enter your name" 
                        className="auth-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <input 
                        type="email" 
                        placeholder="Enter your email" 
                        className="auth-input"
                        value={email} 
                        autoComplete="off" 
                        onChange={(e) => setEmail(e.target.value)} 
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Password</label>
                    <input 
                        type="password" 
                        placeholder="Create a password" 
                        className="auth-input"
                        value={password} 
                        autoComplete="new-password" 
                        onChange={(e) => setPassword(e.target.value)} 
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Confirm Password</label>
                    <input 
                        type="password" 
                        placeholder="Confirm your password" 
                        className="auth-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Phone Number</label>
                    <input 
                        type="text" 
                        placeholder="Enter phone number" 
                        className="auth-input"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                    />
                </div>
                <button type="submit" className="auth-button">Register</button>
            </form>
            <p className="auth-footer">
                Already have an account? <Link to="/" className="auth-link">Login</Link>
            </p>
        </div>
    </div>
  )
}
export default Register
