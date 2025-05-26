'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import '@/components/Header.css'
import './login.css'

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/');
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
  
    try {
      const res = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
  
      const data = await res.json();
  
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/');
      } else {
        setError(data.message || 'Ошибка входа');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Header />
      <style>{'body{background-color: #121212}'}</style>
      <main className="login-main">
        <div className="login-container">
          <div className="login-card">
            <h2 className="login-title">
              <span className="title-text">Вход в аккаунт</span>
            </h2>

            {error && (
              <div className="login-error">
                <svg className="error-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M13,17h-2v-2h2V17z M13,13h-2V7h2V13z"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="phone">Телефон</label>
                <input
                  id="phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+375(XX)XXX-XX-XX"
                  required
                  className="form-input glowEffect"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Пароль</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  required
                  className="form-input glowEffect"
                />
              </div>

              <button 
                type="submit" 
                className="login-button glowEffect"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="button-loader"></span>
                ) : (
                  'Войти'
                )}
              </button>
            </form>

           <div className="login-footer">
            <p className="footer-text">Нет аккаунта?{' '}
            <Link href="/register" legacyBehavior>
    <a className="register-link">Зарегистрироваться</a>
  </Link>
            </p>
          </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}