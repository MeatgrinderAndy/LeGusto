'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import './positions.css'

export default function PositionsTable() {
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/admin/positions')
        if (!response.ok) {
          throw new Error('Failed to fetch positions')
        }
        const data = await response.json()
        setPositions(data)
      } catch (error) {
        setError(error.message)
        console.error('Error fetching positions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDelete = async (id) => {
    if (confirm('Вы уверены, что хотите удалить эту должность?')) {
      try {
        const response = await fetch(`http://localhost:4000/api/admin/positions/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete position')
        }

        setPositions(positions.filter(position => position.position_id !== id))
      } catch (error) {
        setError(error.message)
        console.error('Error deleting position:', error)
      }
    }
  }

  if (loading) {
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
          <span className="title-gradient">Управление должностями</span>
        </h1>
        <Link 
          href="/admin/positions_table/create"
          className="admin-create-btn"
        >
          Добавить должность
        </Link>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название должности</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr key={position.position_id}>
                <td>{position.position_id}</td>
                <td>{position.position_name}</td>
                <td className="actions-cell">
                  <Link 
                    href={`/admin/positions_table/${position.position_id}/edit`}
                    className="edit-link"
                  >
                    Редактировать
                  </Link>
                  <button 
                    onClick={() => handleDelete(position.position_id)}
                    className="delete-btn"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}