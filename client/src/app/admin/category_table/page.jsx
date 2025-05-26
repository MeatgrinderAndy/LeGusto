'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import './category.css'

export default function CategoriesTable() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/admin/categories', {
          credentials: 'include' // Добавляем credentials
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            // Перенаправляем на страницу входа если не авторизован
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch categories')
        }
        
        const data = await response.json()
        setCategories(data)
      } catch (error) {
        console.error('Error fetching categories:', error)
        alert('Ошибка при загрузке категорий')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleDelete = async (id) => {
    if (confirm('Вы уверены, что хотите удалить эту категорию?')) {
      try {
        const response = await fetch(`http://localhost:4000/api/admin/categories/${id}`, { 
          method: 'DELETE',
          credentials: 'include', // Добавляем credentials
          headers: {
            'Content-Type': 'application/json',
          }
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete category');
        }
  
        setCategories(categories.filter(category => category.category_id !== id));
        
      } catch (error) {
        console.error('Error deleting category:', error);
        alert(`Ошибка при удалении: ${error.message}`);
      }
    }
  }

  if (loading) return (
    <div className="page-container">
      <style>{'body{background-color: #121212}'}</style>
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    </div>
  )

  return (
    <div className="page-container">
      <style>{'body{background-color: #121212}'}</style>
      
      <main className="admin-page">
        <div className="admin-header">
          <h1 className="admin-title">
            <span className="title-gradient">Управление категориями</span>
          </h1>
          <Link 
            href="/admin/category_table/create"
            className="admin-create-btn"
          >
            Добавить категорию
          </Link>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Описание</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <tr key={category.category_id}>
                    <td>{category.category_id}</td>
                    <td>{category.category_name}</td>
                    <td>{category.category_description || '—'}</td>
                    <td className="actions-cell">
                      <Link 
                        href={`/admin/category_table/${category.category_id}/edit`}
                        className="edit-link"
                      >
                        Редактировать
                      </Link>
                      <button 
                        onClick={() => handleDelete(category.category_id)}
                        className="delete-btn"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">Нет данных для отображения</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}