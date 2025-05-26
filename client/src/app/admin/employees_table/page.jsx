'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import "./employee.css"

export default function EmployeesTable() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/admin/employees')
        if (!response.ok) {
          throw new Error('Failed to fetch employees')
        }
        const data = await response.json()
        setEmployees(data)
      } catch (error) {
        setError(error.message)
        console.error('Error fetching employees:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDelete = async (id) => {
    if (confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
      try {
        const response = await fetch(`http://localhost:4000/api/admin/employees/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete employee')
        }

        setEmployees(employees.filter(employee => employee.employee_id !== id))
      } catch (error) {
        setError(error.message)
        console.error('Error deleting employee:', error)
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
        <h1 className="admin-title">
          <span className="title-gradient">Управление сотрудниками</span>
        </h1>
        <div>
          <Link href="/admin/employees_table/create" className="admin-create-btn">
            Добавить сотрудника
          </Link>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Фамилия</th>
              <th>Имя</th>
              <th>Должность</th>
              <th>Зарплата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.employee_id}>
                <td>{employee.employee_id}</td>
                <td>{employee.last_name}</td>
                <td>{employee.first_name}</td>
                <td>{employee.position_name}</td>
                <td>{employee.salary} ₽</td>
                <td className="actions-cell">
                  <Link 
                    href={`/admin/employees_table/${employee.employee_id}/edit`}
                    className="edit-link"
                  >
                    Редактировать
                  </Link>
                  <button 
                    onClick={() => handleDelete(employee.employee_id)}
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