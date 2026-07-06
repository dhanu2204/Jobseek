import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Login.css' // Import CSS styles

const Login = () => {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const nav = useNavigate()

    const handleSubmit = async(e) => {
        e.preventDefault()
        if(email.trim() === '' || password.trim() === '') {
            alert('Enter email and password')
            return
        }
        try{
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/login`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email, password: password })
            });
            if(response.ok)
            {
                const user = await response.json()
                if(user)
                {
                  localStorage.setItem('user',JSON.stringify(user))
                  alert(`${user.name}, You have successfully logged in`)
                  nav('/home')  
                }
                else{
                    alert('Invalid credentials')
                }
            }
        }
        catch(error){
            console.log(error)
            alert('Login failed, something went wrong');
        }
        
    }
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="brand-header">
          <div className="brand-logo">JobSeek<span className="brand-dot"></span></div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your JobSeek account</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="auth-input"
              autoComplete="off"  
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              placeholder="Enter your password" 
              className="auth-input"
              autoComplete="off"  
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          <button type="submit" className="auth-button">Sign In</button>
          <p className="auth-footer">
            Don't have an account? <Link to="/register" className="auth-link">Register</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Login