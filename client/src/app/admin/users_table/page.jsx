'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import './users.css'

export default function UsersTable() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:4000/api/admin/users')
      if (!response.ok) {
        throw new Error('Ошибка загрузки пользователей')
      }
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError(err.message)
      console.error('Ошибка:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async (userId, isAdmin) => {
    if (isAdmin) {
      alert('Администратора нельзя удалить')
      return
    }

    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      try {
        const response = await fetch(`http://localhost:4000/api/admin/users/${userId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Ошибка при удалении')
        }

        fetchUsers()
      } catch (err) {
        setError(err.message)
        console.error('Ошибка:', err)
      }
    }
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <style>{'body{background-color: #121212}'}</style>
        <div className="spinner"></div>
        <div>Загрузка пользователей...</div>
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
          <span className="title-gradient">Управление пользователями</span>
        </h1>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Фамилия</th>
              <th>Телефон</th>
              <th>Email</th>
              <th>VIP</th>
              <th>Админ</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id}>
                <td>{user.user_id}</td>
                <td>{user.first_name}</td>
                <td>{user.last_name}</td>
                <td>{user.phone}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`status-badge ${user.vip ? 'status-vip' : 'status-not-vip'}`}>
                    {user.vip ? 'Да' : 'Нет'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.is_admin ? 'status-admin' : 'status-not-admin'}`}>
                    {user.is_admin ? 'Да' : 'Нет'}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => handleDelete(user.user_id, user.is_admin)}
                    className="delete-btn"
                    disabled={user.is_admin}
                    title={user.is_admin ? 'Администратора нельзя удалить' : 'Удалить пользователя'}
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