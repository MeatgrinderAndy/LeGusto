'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import '../../positions.css'

export default function EditPosition() {
  const router = useRouter()
  const params = useParams()
  const positionId = params.id
  const [formData, setFormData] = useState({
    position_name: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/admin/positions/${positionId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch position')
        }

        const positionData = await response.json()
        setFormData({
          position_name: positionData.position_name
        })
      } catch (err) {
        setError(err.message)
        console.error('Error:', err)
      } finally {
        setIsFetching(false)
      }
    }

    fetchData()
  }, [positionId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`http://localhost:4000/api/admin/positions/${positionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      router.push('/admin/positions_table')
    } catch (err) {
      setError(err.message || 'Failed to update position')
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="loading-spinner">
        <style>{'body{background-color: #121212}'}</style>
        <div className="spinner"></div>
        <div>Загрузка данных...</div>
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
        <Link href="/admin/positions_table" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Вернуться к списку
        </Link>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <style>{'body{background-color: #121212}'}</style>
      <div className="admin-header">
        <Link href="/admin/positions_table" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад к списку
        </Link>
        <h1 className="admin-title">
          <span className="title-gradient">Редактировать должность</span>
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
        <div className="form-group">
          <label htmlFor="position_name">Название должности *</label>
          <input
            type="text"
            id="position_name"
            name="position_name"
            value={formData.position_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => router.push('/admin/positions_table')}
            className="cancel-btn"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="submit-btn"
          >
            {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </form>
    </div>
  )
}