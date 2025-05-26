'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import './order.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function CreateOrderPage() {
  const router = useRouter()
  const [cart, setCart] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login?redirect=/order')
      return
    }
  }, [router])

  // Загрузка данных меню и категорий
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const [menuRes, categoriesRes] = await Promise.all([
          fetch('http://localhost:4000/api/menu/order'),
          fetch('http://localhost:4000/api/categories')
        ]);

        if (!menuRes.ok) {
          const errorText = await menuRes.text();
          throw new Error(`Menu fetch failed: ${menuRes.status} ${errorText}`);
        }
        
        if (!categoriesRes.ok) {
          const errorText = await categoriesRes.text();
          throw new Error(`Categories fetch failed: ${categoriesRes.status} ${errorText}`);
        }

        const [menuData, categoriesData] = await Promise.all([
          menuRes.json(),
          categoriesRes.json()
        ]);

        setMenuItems(menuData);
        setCategories(categoriesData);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Ошибка загрузки данных: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.item_id === item.item_id)
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.item_id === item.item_id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      } else {
        return [...prevCart, { ...item, quantity: 1 }]
      }
    })
  }

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.item_id !== itemId))
  }

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId)
      return
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.item_id === itemId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      setError('Добавьте товары в корзину')
      return
    }

    if (!phone) {
      setError('Укажите номер телефона')
      return
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
  
      const response = await fetch('http://localhost:4000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart,
          phone
        })
      });

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const result = await response.json()
      router.push(`/order/confirm/${result.order_id}`)
    } catch (err) {
      setError(err.message || 'Ошибка при оформлении заказа')
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <style>{'body{background-color: #121212}'}</style>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загружаем меню...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <style>{'body{background-color: #121212}'}</style>
      <Header></Header>
      <main className="menu-page">
        <div className="menu-header">
          <h1 className="menu-title">
            <span className="title-gradient">Оформление заказа</span>
          </h1>
        </div>

        {error && (
          <div className="error-message mb-6">
            <svg className="error-icon" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M13,17h-2v-2h2V17z M13,13h-2V7h2V13z"/>
            </svg>
            <p>{error}</p>
          </div>
        )}

        <div className="order-grid-container">
          {/* Меню */}
          <div className="menu-section">
            {categories.map(category => {
              const categoryItems = menuItems.filter(item => item.category_id === category.category_id)
              if (categoryItems.length === 0) return null
              
              return (
                <div key={category.category_id} className="category-section">
                  <h3 className="category-title">
                    {category.category_name}
                  </h3>
                  <div className="items-grid">
                    {categoryItems.map(item => (
                      <div 
                        key={item.item_id} 
                        className="menu-item-card"
                      >
                        <div className="item-content">
                          <div className="item-info">
                            <h4 className="item-name">{item.name}</h4>
                            <p className="item-description">{item.description}</p>
                            <p className="item-price">{item.price} ₽</p>
                          </div>
                          <button
                            onClick={() => addToCart(item)}
                            className="add-to-cart-btn"
                          >
                            Добавить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Корзина */}
          <div className="cart-section">
            <div className="cart-container">
              <h2 className="cart-title">Ваш заказ</h2>
              
              {cart.length === 0 ? (
                <p className="empty-cart-message">Корзина пуста</p>
              ) : (
                <div className="cart-content">
                  <div className="cart-items">
                    {cart.map(item => (
                      <div key={item.item_id} className="cart-item">
                        <div className="item-main-info">
                          <p className="item-name">{item.name}</p>
                          <div className="quantity-controls">
                            <button 
                              onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                              className="quantity-btn"
                            >
                              -
                            </button>
                            <span className="quantity-value">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                              className="quantity-btn"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="item-price-info">
                          <p className="item-total-price">{item.price * item.quantity} ₽</p>
                          <button 
                            onClick={() => removeFromCart(item.item_id)}
                            className="remove-item-btn"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="cart-summary">
                    <div className="total-price">
                      <span>Итого:</span>
                      <span className="total-price-value">{totalPrice} ₽</span>
                    </div>
                  </div>

                  <div className="order-form">
                    <div className="form-group">
                      <label className="form-label">
                        Номер телефона *
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>

                    <button
                      onClick={handleSubmitOrder}
                      className="submit-order-btn"
                    >
                      Оформить заказ
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer></Footer>
    </div>
  )
}