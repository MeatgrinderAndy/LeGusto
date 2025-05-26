'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import './reservations.css'

export default function AdminReservations() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusUpdate, setStatusUpdate] = useState({})

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/admin/reservations')
        if (!response.ok) {
          throw new Error('Failed to fetch reservations')
        }
        const data = await response.json()
        setReservations(data)
      } catch (error) {
        setError(error.message)
        console.error('Error fetching reservations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReservations()
  }, [])

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      setStatusUpdate(prev => ({ ...prev, [reservationId]: true }))
      
      const response = await fetch(`http://localhost:4000/api/admin/reservations/${reservationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update reservation status')
      }

      setReservations(reservations.map(reservation => 
        reservation.reservation_id === reservationId ? { ...reservation, reservation_status: newStatus } : reservation
      ))
    } catch (error) {
      setError(error.message)
      console.error('Error updating reservation status:', error)
    } finally {
      setStatusUpdate(prev => ({ ...prev, [reservationId]: false }))
    }
  }

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-700 text-gray-300'
    
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-900 text-yellow-200'
      case 'confirmed': return 'bg-blue-900 text-blue-200'
      case 'completed': return 'bg-green-900 text-green-200'
      case 'cancelled': return 'bg-red-900 text-red-200'
      case 'no-show': return 'bg-purple-900 text-purple-200'
      default: return 'bg-gray-700 text-gray-300'
    }
  }

  const formatDateTime = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleString('ru-RU', options)
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <style>{'body{background-color: #121212}'}</style>
        <div className="spinner"></div>
        <div>Загрузка бронирований...</div>
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
          Админ-панель
        </Link>
        <h1 className="admin-title">
          <span className="title-gradient">Управление бронированиями</span>
        </h1>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Дата и время</th>
              <th>Стол</th>
              <th>Гости</th>
              <th>Длительность</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => (
              <tr key={reservation.reservation_id}>
                <td>#{reservation.reservation_id}</td>
                <td>{formatDateTime(reservation.reservation_date)}</td>
                <td>Стол #{reservation.table_id}</td>
                <td>{reservation.guests_number}</td>
                <td>{reservation.duration} ч</td>
                <td>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.reservation_status)}`}>
                    {reservation.reservation_status === 'pending' ? 'Ожидает' : 
                     reservation.reservation_status === 'confirmed' ? 'Подтверждено' :
                     reservation.reservation_status === 'completed' ? 'Завершено' :
                     reservation.reservation_status === 'cancelled' ? 'Отменено' :
                     reservation.reservation_status === 'no-show' ? 'Не явились' : reservation.reservation_status}
                  </span>
                </td>
                <td>
                  <select
                    value={reservation.reservation_status}
                    onChange={(e) => handleStatusChange(reservation.reservation_id, e.target.value)}
                    disabled={statusUpdate[reservation.reservation_id]}
                    className="bg-gray-700 border border-gray-600 rounded p-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="pending">Ожидает</option>
                    <option value="confirmed">Подтверждено</option>
                    <option value="completed">Завершено</option>
                    <option value="cancelled">Отменено</option>
                    <option value="no-show">Не явились</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}