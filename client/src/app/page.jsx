'use client'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import './main.css'

export default function Home() {
  const [currentImage, setCurrentImage] = useState(0)
  const [visibleSections, setVisibleSections] = useState([])
  const sectionRefs = useRef([])
  const router = useRouter()

  const images = [
    '/home/French-Food-1.jpg',
    '/home/French-Food-2.jpg',
    '/home/French-Food-3.jpg',
    '/home/French-Food-4.jpg',
    '/home/French-Food-5.png'
  ]

  // Hero section slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => [...new Set([...prev, entry.target.id])])
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    sectionRefs.current.forEach(ref => {
      if (ref) observer.observe(ref)
    })

    return () => {
      sectionRefs.current.forEach(ref => {
        if (ref) observer.unobserve(ref)
      })
    }
  }, [])

  const addToRefs = (el, index) => {
    if (el && !sectionRefs.current.includes(el)) {
      sectionRefs.current[index] = el
    }
  }

  return (
    <div className="home-page">
      <Header />
      <style>{'body { background-color: #121212; }'}</style>
      
      <main className="home-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-background">
            {images.map((img, index) => (
              <img
                key={img}
                src={img}
                alt=""
                className={`hero-image ${index === currentImage ? 'active' : ''}`}
              />
            ))}
          </div>
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-title">
                <span className="title-gradient">Добро пожаловать в Le Gusto</span>
              </h1>
              <p className="hero-subtitle">
                Авторская кухня в сочетании с идеальной винной картой и превосходным сервисом
              </p>
              <button 
                className="hero-button glowEffect"
                onClick={() => router.push("/reservation")}
              >
                ЗАБРОНИРОВАТЬ СТОЛИК
              </button>
            </div>
          </div>
        </section>

        <section 
          id="about" 
          ref={el => addToRefs(el, 0)} 
          className={`about-section ${visibleSections.includes('about') ? 'visible' : ''}`}
        >
          <div className="about-container">
            <h2 className="section-title">
              <span className="title-decoration">О РЕСТОРАНЕ</span>
            </h2>
            <div className="about-content">
              <p className="about-text">
                Le Gusto – популярный городской ресторан, находящийся в историческом центре Минска. 
                Это заведение, созданное по стандартам лучших европейских брассери, отличается особым 
                уютом и домашним комфортом.
              </p>
            </div>
          </div>
        </section>

        <section 
          id="atmosphere" 
          ref={el => addToRefs(el, 1)} 
          className={`feature-section ${visibleSections.includes('atmosphere') ? 'visible' : ''}`}
        >
          <div className="feature-container">
            <div className="feature-image left">
              <img src="/home/interior.jpeg" alt="Интерьер ресторана" />
            </div>
            <div className="feature-text right">
              <h3>Уютная атмосфера</h3>
              <p>
                Наш интерьер сочетает в себе французский шарм и современный комфорт. 
                Теплое освещение, натуральные материалы и продуманный дизайн создают 
                неповторимую атмосферу для вашего отдыха.
              </p>
            </div>
          </div>
        </section>

        <section 
          id="chef" 
          ref={el => addToRefs(el, 2)} 
          className={`feature-section dark ${visibleSections.includes('chef') ? 'visible' : ''}`}
        >
          <div className="feature-container reverse">
            <div className="feature-image right">
              <img src="/home/chef.jpeg" alt="Шеф-повар" />
            </div>
            <div className="feature-text left">
              <h3>Мастерство шеф-повара</h3>
              <p>
                Наш шеф-повар, прошедший обучение в лучших ресторанах Франции, создает 
                настоящие кулинарные шедевры. Каждое блюдо - это гармония вкусов и 
                эстетики, приготовленная с любовью и вниманием к деталям.
              </p>
            </div>
          </div>
        </section>

        <section 
          id="wine" 
          ref={el => addToRefs(el, 3)} 
          className={`feature-section ${visibleSections.includes('wine') ? 'visible' : ''}`}
        >
          <div className="feature-container">
            <div className="feature-image left">
              <img src="/home/wines.png" alt="Винная карта" />
            </div>
            <div className="feature-text right">
              <h3>Эксклюзивная винная карта</h3>
              <p>
                Наш сомелье подобрал уникальную коллекцию вин со всего мира. 
                Особое внимание уделено французским винодельческим регионам - 
                Бордо, Бургундия, Шампань. Каждое вино идеально сочетается с блюдами нашего меню.
              </p>
            </div>
          </div>
        </section>

        <section 
          id="events" 
          ref={el => addToRefs(el, 4)} 
          className={`feature-section dark ${visibleSections.includes('events') ? 'visible' : ''}`}
        >
          <div className="feature-container reverse">
            <div className="feature-image right">
              <img src="/home/event.jpg" alt="Мероприятия" />
            </div>
            <div className="feature-text left">
              <h3>Специальные мероприятия</h3>
              <p>
                Мы регулярно проводим гастрономические вечера, дегустации вин и кулинарные мастер-классы. 
                Следите за нашими анонсами, чтобы не пропустить уникальные события в мире высокой кухни.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}