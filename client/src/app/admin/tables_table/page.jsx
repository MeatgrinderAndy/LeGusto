'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import './tables.css'

export default function TablesTable() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/admin/tables')
        if (!response.ok) {
          throw new Error('Failed to fetch tables')
        }
        const data = await response.json()
        setTables(data)
      } catch (error) {
        setError(error.message)
        console.error('Error fetching tables:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDelete = async (id) => {
    if (confirm('Вы уверены, что хотите удалить этот стол?')) {
      try {
        const response = await fetch(`http://localhost:4000/api/admin/tables/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete table')
        }

        setTables(tables.filter(table => table.table_id !== id))
      } catch (error) {
        setError(error.message)
        console.error('Error deleting table:', error)
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
          <span className="title-gradient">Управление столами</span>
        </h1>
        <Link 
          href="/admin/tables_table/create"
          className="admin-create-btn"
        >
          Добавить стол
        </Link>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Вместимость</th>
              <th>Официант</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((table) => (
              <tr key={table.table_id}>
                <td>{table.table_id}</td>
                <td>{table.capacity}</td>
                <td>{table.waiter || 'Не назначен'}</td>
                <td className="actions-cell">
                  <Link 
                    href={`/admin/tables_table/${table.table_id}/edit`}
                    className="edit-link"
                  >
                    Редактировать
                  </Link>
                  <button 
                    onClick={() => handleDelete(table.table_id)}
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