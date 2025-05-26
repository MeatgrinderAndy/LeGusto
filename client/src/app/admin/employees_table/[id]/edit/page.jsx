'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function EditEmployee() {
  const router = useRouter()
  const params = useParams()
  const employeeId = params.id
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    position_id: '',
    salary: ''
  })
  const [positions, setPositions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeeRes, positionsRes] = await Promise.all([
          fetch(`http://localhost:4000/api/admin/employees/${employeeId}`),
          fetch('http://localhost:4000/api/admin/positions')
        ])

        if (!employeeRes.ok) throw new Error('Failed to fetch employee')
        if (!positionsRes.ok) throw new Error('Failed to fetch positions')

        const [employeeData, positionsData] = await Promise.all([
          employeeRes.json(),
          positionsRes.json()
        ])

        setFormData({
          first_name: employeeData.first_name,
          last_name: employeeData.last_name,
          position_id: employeeData.position_id,
          salary: employeeData.salary
        })
        setPositions(positionsData)
      } catch (err) {
        setError(err.message)
        console.error('Error:', err)
      } finally {
        setIsFetching(false)
      }
    }

    fetchData()
  }, [employeeId])

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
      const response = await fetch(`http://localhost:4000/api/admin/employees/${employeeId}`, {
        method: 'PUT',
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
      setError(err.message || 'Failed to update employee')
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="page-container">
        <div className="admin-page">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Загрузка данных...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="admin-page">
          <div className="error-message">
            <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {error}
          </div>
          <Link href="/admin/employees_table" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Вернуться к списку
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="admin-page">
        <div className="admin-header">
          <Link href="/admin/employees_table" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Назад к списку сотрудников
          </Link>
          <h1 className="admin-title">
            <span className="title-gradient">Редактировать сотрудника</span>
          </h1>
          <p className="admin-subtitle">Обновите информацию о сотруднике</p>
        </div>

        {error && (
          <div className="error-message">
            <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {error}
          </div>
        )}

        <div className="statistics-card">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="last_name">
                  Фамилия *
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="first_name">
                  Имя *
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="position_id">
                  Должность *
                </label>
                <select
                  id="position_id"
                  name="position_id"
                  value={formData.position_id}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
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

              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="salary">
                  Зарплата (₽) *
                </label>
                <input
                  type="number"
                  id="salary"
                  name="salary"
                  min="0"
                  step="0.01"
                  value={formData.salary}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => router.push('/admin/employees_table')}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="refresh-btn"
              >
                {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}