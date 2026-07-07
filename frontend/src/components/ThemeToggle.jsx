import React, { useEffect, useState } from 'react'
import './ThemeToggle.css'

const ThemeToggle = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => {
            const next = prev === 'light' ? 'dark' : 'light'
            localStorage.setItem('theme', next)
            return next
        })
    }

    return (
        <button onClick={toggleTheme} className="theme-toggle-btn no-print" title="Toggle Light/Dark Theme">
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
    )
}

export default ThemeToggle
