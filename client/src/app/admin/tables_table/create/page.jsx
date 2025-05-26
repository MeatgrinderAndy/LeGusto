'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import '../tables.css'

export default function CreateTable() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    capacity: '',
    waiter: ''
  })
  const [waiters, setWaiters] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingWaiters, setIsFetchingWaiters] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchWaiters = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/admin/waiters')
        if (!response.ok) {
          throw new Error('Failed to fetch waiters')
        }
        const data = await response.json()
        setWaiters(data)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching waiters:', err)
      } finally {
        setIsFetchingWaiters(false)
      }
    }

    fetchWaiters()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || '' : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:4000/api/admin/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          capacity: parseInt(formData.capacity)
        }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      router.push('/admin/tables_table')
    } catch (err) {
      setError(err.message || 'Failed to create table')
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetchingWaiters) {
    return (
      <div className="loading-spinner">
        <style>{'body{background-color: #121212}'}</style>
        <div className="spinner"></div>
        <div>Загрузка данных об официантах...</div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <style>{'body{background-color: #121212}'}</style>
      <div className="admin-header">
        <Link href="/admin/tables_table" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад к списку
        </Link>
        <h1 className="admin-title">
          <span className="title-gradient">Добавить новый стол</span>
        </h1>
      </div>

      {error && (
        <div className="error-message">
          <svg className="error-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12,2L1,21H23M12,6L19.5,19H4.5M11,10V14H13V10M11,16V18H13V16" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="form-group">
            <label htmlFor="capacity">Вместимость (чел) *</label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              min="1"
              value={formData.capacity}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="waiter">Официант</label>
            <select
              id="waiter"
              name="waiter"
              value={formData.waiter}
              onChange={handleChange}
            >
              <option value="">Не назначен</option>
              {waiters.map(waiter => (
                <option key={waiter.employee_id} value={waiter.employee_id}>
                  {waiter.last_name} {waiter.first_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={isLoading}
            className="submit-btn"
          >
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  )
}