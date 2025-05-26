'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateEmployee() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    position_id: '',
    salary: ''
  })
  const [positions, setPositions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingPositions, setIsFetchingPositions] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/admin/positions')
        if (!response.ok) {
          throw new Error('Failed to fetch positions')
        }
        const data = await response.json()
        setPositions(data)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching positions:', err)
      } finally {
        setIsFetchingPositions(false)
      }
    }

    fetchPositions()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'salary' ? parseFloat(value) || '' : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:4000/api/admin/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          salary: parseFloat(formData.salary)
        }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      router.push('/admin/employees_table')
    } catch (err) {
      setError(err.message || 'Failed to create employee')
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetchingPositions) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <div>Загрузка данных о должностях...</div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <style>{'body{background-color: #121212}'}</style>
      <div className="admin-header">
        <Link href="/admin/employees_table" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад к списку
        </Link>
        <h1 className="admin-title">
          <span className="title-gradient">Добавить нового сотрудника</span>
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
          <label htmlFor="last_name">Фамилия *</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="first_name">Имя *</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="position_id">Должность *</label>
          <select
            id="position_id"
            name="position_id"
            value={formData.position_id}
            onChange={handleChange}
            required
          >
            <option value="">Выберите должность</option>
            {positions.map(position => (
              <option key={position.position_id} value={position.position_id}>
                {position.position_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="salary">Зарплата (₽) *</label>
          <input
            type="number"
            id="salary"
            name="salary"
            min="0"
            step="0.01"
            value={formData.salary}
            onChange={handleChange}
            required
          />
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