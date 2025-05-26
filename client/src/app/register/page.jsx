'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import '@/components/Header.css'
import './register.css'

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/');
    }
  }, [router]);

  const validatePhone = (phoneNumber) => {
    const regex = /^\+375\d{2}\d{3}\d{2}\d{2}$/;
    return regex.test(phoneNumber);
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhone(value);
    
    if (!validatePhone(value) && value.length > 0) {
      setPhoneError('Некоректный номер телефона');
    } else {
      setPhoneError('');
    }
  };

  const checkPasswordStrength = (pass) => {
    if (pass.length === 0) {
      setPasswordStrength('');
      return;
    }

    if (pass.length < 8) {
      setPasswordStrength('Пароль должен содержать минимум 8 символов');
      return;
    }

    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);

    if (hasUpper && hasLower && hasNumbers && hasSpecial) {
      setPasswordStrength('Сильный пароль');
    } else if ((hasLetters && hasNumbers) || (hasLetters && hasSpecial) || (hasNumbers && hasSpecial)) {
      setPasswordStrength('Средний пароль');
    } else {
      setPasswordStrength('Слабый пароль');
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    checkPasswordStrength(value);
  };

  const handleRegister = async (e) => {
  e.preventDefault();
  setError('');

  if (!validatePhone(phone)) {
    setPhoneError('Неверный формат телефона');
    return;
  }

  if (password.length < 8) {
    setPasswordStrength('Пароль должен содержать минимум 8 символов');
    return;
  }

  setIsLoading(true);

  try {
    const res = await fetch('http://localhost:4000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, surname, phone, password }),
    });

    const data = await res.json();

    if (res.ok) {
      router.push('/login');
    } else {
      if (data.message && data.message.includes('уже зарегистрирован')) {
        setPhoneError(data.message); 
      } else {
        setError(data.message || 'Ошибка регистрации'); 
      }
    }
  } catch (err) {
    setError('Ошибка соединения с сервером');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="register-page">
      <Header />
      <style>{'body{background-color: #121212}'}</style>
      <main className="register-main">
        <div className="register-container">
          <div className="register-card">
            <h2 className="register-title">
              <span className="title-text">Регистрация</span>
            </h2>

            {error && (
              <div className="register-error">
                <svg className="error-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M13,17h-2v-2h2V17z M13,13h-2V7h2V13z"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="register-form">
              <div className="form-group">
                <label htmlFor="name">Имя</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите ваше имя"
                  required
                  className="form-input glowEffect"
                />
              </div>

              <div className="form-group">
                <label htmlFor="surname">Фамилия</label>
                <input
                  id="surname"
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="Введите вашу фамилию"
                  required
                  className="form-input glowEffect"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Телефон</label>
                <input
                  id="phone"
                  type="text"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+375(XX)XXX-XX-XX"
                  required
                  className={`form-input glowEffect ${phoneError ? 'input-error' : ''}`}
                />
                {phoneError && <div className="input-error-message">{phoneError}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Пароль</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Придумайте пароль"
                  required
                  className="form-input glowEffect"
                />
                {passwordStrength && (
                  <div className={`password-strength ${
                    passwordStrength.includes('Слабый') ? 'strength-weak' :
                    passwordStrength.includes('Средний') ? 'strength-medium' :
                    'strength-strong'
                  }`}>
                    {passwordStrength}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="register-button glowEffect"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="button-loader"></span>
                ) : (
                  'Зарегистрироваться'
                )}
              </button>
            </form>

            <div className="register-footer">
              <p className="footer-text">Уже есть аккаунт?{' '}
                <Link href="/login" legacyBehavior>
                  <a className="login-link">Войти</a>
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