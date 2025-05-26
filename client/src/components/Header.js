'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import './Header.css'
import Image from 'next/image'
import logo from '../../public/GustoLogo.svg'
import { FaUser } from 'react-icons/fa'

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    setIsLoggedIn(!!token)
    
    if (user) {
      try {
        const userData = JSON.parse(user)
        setIsAdmin(userData.is_admin === true)
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setIsAdmin(false)
    setIsMenuOpen(false)
    router.push('/')
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const navigateToProfile = () => {
    router.push('/user')
    setIsMenuOpen(false)
  }

  return (
    <header className="header">
      <div className="header-container">
        <Link href="/" className="logo">
          <Image 
            src={logo} 
            alt="Le Gusto" 
            width={100}
            className="logo-svg"
          />
        </Link>
        
        <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
          <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}></span>
        </button>

        <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
          <ul className="nav-menu">
            {[
              { href: "/", label: "О РЕСТОРАНЕ" },
              { href: "/menu", label: "МЕНЮ" },
              { href: "/order", label: "ЗАКАЗ" },
              { href: "/contacts", label: "КОНТАКТЫ"},
              ...(isAdmin ? [{ href: "/admin", label: "АДМИН" }] : []),
            ].map((item) => (
              <li key={item.href} className="nav-item">
                <Link 
                  href={item.href} 
                  className="nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="nav-item">
              {isLoggedIn ? (
                <div className="user-actions">
                  <button 
                    onClick={navigateToProfile} 
                    className="user-icon"
                    aria-label="User profile"
                  >
                    <FaUser className="user-icon-svg" />
                  </button>
                  <button 
                    onClick={handleLogout} 
                    className="nav-link button-link glowEffect"
                  >
                    ВЫЙТИ
                  </button>
                </div>
              ) : (
                <Link 
                  href="/login" 
                  className="nav-link button-link glowEffect"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ВХОД
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}