'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import './orders.css'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusUpdate, setStatusUpdate] = useState({})

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/admin/orders')
        if (!response.ok) {
          throw new Error('Failed to fetch orders')
        }
        const data = await response.json()
        setOrders(data)
      } catch (error) {
        setError(error.message)
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setStatusUpdate(prev => ({ ...prev, [orderId]: true }))
      
      const response = await fetch(`http://localhost:4000/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      setOrders(orders.map(order => 
        order.order_id === orderId ? { ...order, status: newStatus } : order
      ))
    } catch (error) {
      setError(error.message)
      console.error('Error updating order status:', error)
    } finally {
      setStatusUpdate(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-700 text-gray-300'
    
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-900 text-yellow-200'
      case 'confirmed': return 'bg-blue-900 text-blue-200'
      case 'completed': return 'bg-green-900 text-green-200'
      case 'declined': return 'bg-red-900 text-red-200'
      default: return 'bg-gray-700 text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <style>{'body{background-color: #121212}'}</style>
        <div className="spinner"></div>
        <div>Загрузка заказов...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-page">
        <style>{'body{background-color: #121212}'}</style>
        <div className="error-message">
          <svg className="error-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12,2L1,21H23M12,6L19.5,19H4.5M11,10V14H13V10M11,16V18H13V16" />
          </svg>
          {error}
        </div>
        <Link href="/admin" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Вернуться в админ-панель
        </Link>
      </div>
    )
  }

  return (
    <div className="admin-page">
      
      <style>{'body{background-color: #121212}'}</style>
      <div className="admin-header">
        <Link href="/admin" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Вернуться в админ-панель
        </Link>
        <h1 className="admin-title">
          <span className="title-gradient">Управление заказами</span>
        </h1>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID заказа</th>
              <th>Дата</th>
              <th>Клиент</th>
              <th>Сумма</th>
              <th>Товаров</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.order_id}>
                <td>#{order.order_id}</td>
                <td>{new Date(order.order_date).toLocaleString()}</td>
                <td>{order.user_id}</td>
                <td>{order.total_price} ₽</td>
                <td>{order.item_quantity}</td>
                <td>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="actions-cell">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                    disabled={statusUpdate[order.order_id]}
                    className="bg-gray-700 border border-gray-600 rounded p-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="pending">Ожидает</option>
                    <option value="confirmed">Подтвержден</option>
                    <option value="completed">Завершен</option>
                    <option value="declined">Отменен</option>
                  </select>
                  <Link 
                    href={`/admin/orders_table/orders/${order.order_id}`}
                    className="edit-link ml-2"
                  >
                    Подробнее
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}