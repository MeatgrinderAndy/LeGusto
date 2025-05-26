'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import './order.css'

export default function OrderDetails() {
  const router = useRouter()
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const response = await fetch(`http://localhost:4000/api/admin/orders/${id}`)

        if (!response.ok) {
          throw new Error('Не удалось загрузить данные заказа')
        }

        const data = await response.json()
        console.log(data)
        setOrder(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id])

  if (loading) {
    return (
      <div className="loading-spinner">
        <style>{'body{background-color: #121212}'}</style>
        <div className="spinner"></div>
        <div>Загрузка данных заказа...</div>
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
        <Link href="/admin/orders_table" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Вернуться к списку заказов
        </Link>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="admin-page">
        <style>{'body{background-color: #121212}'}</style>
        <div className="error-message">
          <svg className="error-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12,2L1,21H23M12,6L19.5,19H4.5M11,10V14H13V10M11,16V18H13V16" />
          </svg>
          Заказ не найден
        </div>
        <Link href="/admin/orders_table" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Вернуться к списку заказов
        </Link>
      </div>
    )
  }

  const totalPrice = order.items.reduce(
    (sum, item) => sum + parseFloat(item.pos_price),
    0
  )

  const orderDate = new Date(order.order_date).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-900 text-yellow-200'
      case 'completed': return 'bg-green-900 text-green-200'
      case 'cancelled': return 'bg-red-900 text-red-200'
      case 'confirmed': return 'bg-blue-900 text-blue-200'
      default: return 'bg-gray-700 text-gray-300'
    }
  }

  return (
    <div className="admin-page">
        <style>{'body{background-color: #121212}'}</style>
      <div className="admin-header">
        <Link href="/admin/orders_table" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад к списку заказов
        </Link>
        <h1 className="admin-title">
          <span className="title-gradient">Детали заказа #{order.order_id}</span>
        </h1>
      </div>

      <div className="admin-form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="form-group">
            <label>Номер заказа</label>
            <div className="label-text">{order.order_id}</div>
          </div>

          <div className="form-group">
            <label>Дата заказа</label>
            <div className="label-text">{orderDate}</div>
          </div>

          <div className="form-group">
            <label>Статус</label>
            <div className="p-2 rounded capitalize">
              <span className={`px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                {order.status === 'pending' ? 'в обработке' : 
                 order.status === 'completed' ? 'завершен' :
                 order.status === 'cancelled' ? 'отменен' : 
                 order.status === 'confirmed' ? 'подтвержден' : order.status}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Телефон клиента</label>
            <div className="p-2 bg-gray-700 rounded">{order.phone}</div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="label-text">Состав заказа</h2>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Товар</th>
                  <th className="text-right">Кол-во</th>
                  <th className="text-right">Цена</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.item_id}>
                    <td>
                      <div className="font-medium">{item.item_name}</div>
                      {item.notes && (
                        <div className="text-xs text-gray-400 mt-1">{item.notes}</div>
                      )}
                    </td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{item.pos_price} ₽</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2" className="text-right font-medium pr-4">
                    Итого:
                  </td>
                  <td className="text-right font-bold text-amber-400">
                    {totalPrice} ₽
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {order.notes && (
          <div className="form-group mb-8">
            <label>Примечания к заказу</label>
            <div className="p-4 bg-gray-700 rounded-lg">
              <p className="text-gray-300">{order.notes}</p>
            </div>
          </div>
        )}

        <div className="form-actions">
          <Link
            href="/admin/orders_table"
            className="cancel-btn"
          >
            Вернуться к списку
          </Link>
        </div>
      </div>
    </div>
  )
}