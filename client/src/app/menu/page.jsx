'use client'
import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import './menu.css'

const MenuPage = () => {
  const [menuData, setMenuData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null) // Изначально null вместо первой категории
  const [animateItems, setAnimateItems] = useState(false)
  const [imageUrls, setImageUrls] = useState({})

  useEffect(() => {
  const fetchMenuData = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/menu', {
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`)
      }

      const data = await response.json()
      setMenuData(data)
      
      const urls = {}
      await Promise.all(
        data.map(async (category) => {
          if (category.image_data) {
            // Исправляем создание Blob для категорий
            const blob = new Blob([new Uint8Array(category.image_data)], { type: 'image/jpeg' })
            urls[`category_${category.id}`] = URL.createObjectURL(blob)
          }
          
          if (category.items) {
            await Promise.all(
              category.items.map(async (item) => {
                if (item.image_data) {
                  // Исправляем создание Blob для элементов меню
                  const blob = new Blob([new Uint8Array(item.image_data)], { type: 'image/jpeg' })
                  urls[`item_${item.item_id}`] = URL.createObjectURL(blob)
                }
              })
            )
          }
        })
      )
      
      setImageUrls(urls)
    } catch (err) {
      console.error('Ошибка:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  fetchMenuData()

  return () => {
    Object.values(imageUrls).forEach(url => URL.revokeObjectURL(url))
  }
}, [])

  const handleCategoryChange = (categoryId) => {
    setAnimateItems(false)
    setActiveCategory(categoryId)
    
    setTimeout(() => {
      setAnimateItems(true)
    }, 50)
  }

  if (loading) {
    return (
      <div className="page-container">
        <style>{'body{background-color: #121212}'}</style>
        <Header />
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загружаем меню...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <style>{'body {background-color: #121212}'}</style>
        <Header />
        <div className="error-message">
          <svg className="error-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M13,17h-2v-2h2V17z M13,13h-2V7h2V13z"/>
          </svg>
          <p>{error}</p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="page-container">
      <style>{'body{background-color: #121212}'}</style>
      <Header />
      <main className="menu-page">
        <div className="menu-header">
          <h1 className="menu-title">
            <span className="title-gradient">Наше меню</span>
          </h1>
        </div>

        <div className="category-menu-container">
          <div className="category-sidebar">
            <ul className="category-list">
              {menuData.map((category) => (                
                <li 
                  key={category.id} 
                  className={`category-item ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(category.id)}
                >
                  <div className="category-image-container">
                    {imageUrls[`category_${category.id}`] ? (
                      <img 
                        src={imageUrls[`category_${category.id}`]} 
                        alt={category.name} 
                        className="category-image"
                        onError={(e) => {
                          e.currentTarget.src = '/category-images/default.jpg'
                        }}
                      />
                    ) : (
                      <div className="category-image-placeholder">
                        <svg className="placeholder-icon" viewBox="0 0 24 24">
                          <path fill="#666" d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="category-name">{category.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="category-content">
            {activeCategory ? (
              menuData.map((category) => (
                <div 
                  key={category.id} 
                  className={`category-section ${activeCategory === category.id ? 'active' : ''}`}
                >
                  <div className="category-banner">
                    {imageUrls[`category_${category.id}`] ? (
                      <img 
                        src={imageUrls[`category_${category.id}`]} 
                        alt={category.name} 
                        className="category-banner-image"
                        onError={(e) => {
                          e.currentTarget.src = '/category-images/default.jpg'
                        }}
                      />
                    ) : (
                      <div className="category-banner-placeholder">
                        <svg className="placeholder-icon" viewBox="0 0 24 24">
                          <path fill="#666" d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z"/>
                        </svg>
                      </div>
                    )}
                    <div className="category-banner-overlay">
                      <h2 className="category-title">{category.name}</h2>
                      {category.category_description && (
                        <p className="category-description">{category.category_description}</p>
                      )}
                    </div>
                  </div>
                  
                  <ul className="items-list">
                    {category.items && category.items.map((item, index) => (
                      <li 
                        key={item.item_id} 
                        className={`menu-item ${animateItems ? 'animate' : ''}`}
                        style={{ transitionDelay: `${index * 0.05}s` }}
                      >
                        <div className="item-image-container">
                          {imageUrls[`item_${item.item_id}`] ? (
                            <img 
                              src={imageUrls[`item_${item.item_id}`]} 
                              alt={item.name || item.item_name} 
                              className="item-image"
                              onError={(e) => {
                                e.currentTarget.src = '/menu-images/default.jpg'
                              }}
                            />
                          ) : (
                            <div className="item-image-placeholder">
                              <svg className="placeholder-icon" viewBox="0 0 24 24">
                                <path fill="#666" d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="item-details">
                          <div className="item-info">
                            <h3 className="item-name">{item.name || item.item_name}</h3>
                            {item.description && (
                              <p className="item-description">{item.description}</p>
                            )}
                          </div>
                          <div className="item-price">{item.price} ₽</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <div className="no-category-selected">
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default MenuPage