'use client'
import Head from 'next/head'
import './contacts.css'
import Header from '@/components/Header'
import YandexMap from '@/components/YandexMap'
import Footer from '@/components/Footer'

export default function ContactsPage() {
  return (
    <>
      <style>{'body { background-color: #121212; }'}</style>
      <Header />
      <Head>
        <title>Контакты | Le Gusto</title>
        <meta name="description" content="Свяжитесь с нами" />
      </Head>
      
      <main className="contacts-container">
        <section className="hero-section-contact">
          <div className="hero-content-contact">
            <h1 className="hero-title-contact">
              <span className="title-gradient">Наши контакты</span>
            </h1>
            <p className="hero-subtitle-contact">
              Мы всегда рады видеть вас в нашем ресторане
            </p>
          </div>
        </section>

        <section className="info-section">
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <h3 className="info-title">Адрес</h3>
              <p className="info-text">г. Минск, ул. Ленина, 2</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </div>
              <h3 className="info-title">Email</h3>
              <p className="info-text">info@legusto.by</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
              </div>
              <h3 className="info-title">Телефон</h3>
              <p className="info-text">+375 (29) 123-45-67</p>
              <p className="info-text">+375 (17) 987-65-43</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
              </div>
              <h3 className="info-title">Часы работы</h3>
              <p className="info-text">Пн-Пт: 11:00 - 23:00</p>
              <p className="info-text">Сб-Вс: 11:00 - 00:00</p>
            </div>
          </div>
        </section>

        <section className="map-section">
          <div className="map-container">
            <YandexMap 
              apiKey={"ad4f93eb-fe62-4927-bf07-47aea5442e64"}
              center={[53.902240, 27.556370]}
              zoom={17}
              markerCoords={[53.902240, 27.556370]}
              markerContent={
                `<div class="map-balloon">
                  <h4>Ресторан Le Gusto</h4>
                  <p><i class="icon-map-marker"></i> Минск, ул. Ленина 2</p>
                  <p><i class="icon-clock"></i> Часы работы: 11:00-23:00</p>
                  <p><i class="icon-phone"></i> +375 29 859-50-40</p>
                </div>`
              }
            />
          </div>
        </section>

        <section className="social-section">
          <h2 className="section-title-contact">Мы в социальных сетях</h2>
          <div className="social-links">
            <a href="#" className="social-link" aria-label="Instagram">
              <svg className="social-icon" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span>Instagram</span>
            </a>
            <a href="#" className="social-link" aria-label="Facebook">
              <svg className="social-icon" viewBox="0 0 24 24">
                <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
              </svg>
              <span>Facebook</span>
            </a>
            <a href="#" className="social-link" aria-label="Telegram">
              <svg className="social-icon" viewBox="0 0 24 24">
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
              </svg>
              <span>Telegram</span>
            </a>
          </div>
        </section>
      </main>
      <Footer/>
    </>
  )
}