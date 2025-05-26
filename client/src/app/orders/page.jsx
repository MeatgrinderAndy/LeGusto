'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import './orders.css'
import Header from '@/components/Header'

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login?redirect=/orders');
      return;
    }
  
    try {
      const parsedUser = JSON.parse(userData);
      if (!parsedUser?.id) {
        throw new Error('Invalid user data');
      }
      setUser(parsedUser);
    } catch (e) {
      console.error('Error parsing user data:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login?redirect=/orders');
    }
  }, [router]);

  useEffect(() => {
    if (!user?.id) return

    const fetchOrders = async () => {
        try {
          setLoading(true);
          setError('');
          
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:4000/api/user/${user.id}/orders`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
      
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Ожидался JSON, но получили: ${text.slice(0, 100)}...`);
          }
      
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ошибка! Статус: ${response.status}`);
          }
      
          const data = await response.json();
          setOrders(data);
        } catch (err) {
          console.error('Fetch orders error:', err);
          setError(err.message.includes('<!DOCTYPE html>') 
            ? 'Сервер вернул HTML вместо JSON. Проверьте URL API.'
            : err.message);
        } finally {
          setLoading(false);
        }
      };

    fetchOrders()
  }, [user, router])

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter)

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    return new Date(dateString).toLocaleString('ru-RU', options)
  }

  const formatPrice = (price) => {
    return parseFloat(price).toFixed(2).replace('.', ',') + ' ₽'
  }

 if (loading) {
    return (
      <div className="loadingScreen">
              <style>{'body { background-color: #121212; }'}</style>
      
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
              <style>{'body { background-color: #121212; }'}</style>
      
        <div className="errorMessage">
          {error}
        </div>
        <Link href="/" className="backToHomeLink">
          Вернуться на главную
        </Link>
      </div>
    );
  }

  return (
    <div className="ordersContainer">
      <Header/>
      <style>{'body { background-color: #121212; }'}</style>
      <div className="ordersHeader">
        <h1 className="ordersTitle">
          <span className="titleGradient">{user?.is_admin ? 'Все заказы' : 'Мои заказы'}</span>
        </h1>

        <div className="ordersFilter">
          <button
            onClick={() => setFilter('all')}
            className={`filterButton ${filter === 'all' ? 'activeFilter' : ''}`}
          >
            Все
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`filterButton ${filter === 'pending' ? 'activeFilter' : ''}`}
          >
            В обработке
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`filterButton ${filter === 'completed' ? 'activeFilter' : ''}`}
          >
            Завершенные
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`filterButton ${filter === 'cancelled' ? 'activeFilter' : ''}`}
          >
            Отмененные
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="noOrders">
          <p>Заказов не найдено</p>
          <Link href="/" className="menuLink">
            Перейти в меню
          </Link>
        </div>
      ) : (
        <div className="ordersGrid">
          {filteredOrders.map(order => {
            const totalPrice = order.items.reduce((sum, item) => sum + item.price, 0);

            return (
              <div key={order.order_id} className="orderCard">
                <div className="orderHeader">
                  <div className="orderInfo">
                    <span className="orderNumber">Заказ #{order.order_id}</span>
                    <span className="orderDate">{formatDate(order.created_at)}</span>
                  </div>
                  <div className={`orderStatus ${order.status}`}>
                    {order.status === 'pending' ? 'В обработке' : 
                     order.status === 'completed' ? 'Завершен' :
                     order.status === 'cancelled' ? 'Отменен' : order.status}
                    <span className="orderTotal">{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                <div className="orderContent">
                  <div className="orderItems">
                    {order.items.slice(0, 3).map(item => (
                      <div key={item.order_item_id} className="orderItem">
                        <div className="itemImageContainer">
                          <img 
                            src={item.image_url || '/images/food-placeholder.png'} 
                            alt={item.name}
                            className="itemImage"
                            onError={(e) => {
                              e.target.src = '/images/food-placeholder.png';
                            }}
                          />
                        </div>
                        <div className="itemDetails">
                          <h3 className="itemName">{item.name}</h3>
                          <p className="itemQuantity">× {item.quantity}</p>
                          {item.description && (
                            <p className="itemDescription">{item.description}</p>
                          )}
                        </div>
                        <div className="itemPrice">
                          {formatPrice(item.price)}
                        </div>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="additionalItems">
                        +{order.items.length - 3} позиций
                      </div>
                    )}
                  </div>

                  <div className="orderFooter">
                    {order.delivery_address && (
                      <div className="deliveryInfo">
                        <span className="deliveryLabel">Адрес:</span>
                        <span className="deliveryAddress">{order.delivery_address}</span>
                      </div>
                    )}
                    {order.notes && (
                      <div className="orderNotes">
                        <span className="notesLabel">Примечание:</span>
                        <span className="notesText">{order.notes}</span>
                      </div>
                    )}
                    <Link
                      href={`/order-confirmation/${order.order_id}`}
                      className="detailsButton"
                    >
                      Подробнее
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}