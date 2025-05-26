'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import "./menuitem.css"

export default function MenuItemsTable() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/admin/menuitems')
        const data = await response.json()
        setItems(data)
      } catch (error) {
        console.error('Error fetching menu items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDelete = async (id) => {
    if (confirm('Вы уверены, что хотите удалить этот элемент?')) {
      try {
        const response = await fetch(`http://localhost:4000/api/admin/menuitems/${id}`, { 
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete menu item');
        }
  
        const result = await response.json();
        console.log('Deleted successfully:', result.deletedItem);
        
        setItems(items.filter(item => item.item_id !== id));
        
      } catch (error) {
        console.error('Error deleting item:', error);
        alert(`Ошибка при удалении: ${error.message}`);
      }
    }
  }

  if (loading) {
    return (
      <div className="page-container">
         <style>{'body{background-color: #121212}'}</style>
        <main className="admin-page">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Загрузка данных...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page-container">
       <style>{'body{background-color: #121212}'}</style>
      <main className="admin-page">
        <div className="admin-header">
          <Link href="/admin" className="back-link">
            ← Назад
          </Link>
          <h1 className="admin-title">
            <span className="title-gradient">Управление меню</span>
          </h1>
          <Link 
            href="/admin/menuitems_table/create"
            className="admin-create-btn"
          >
            Добавить блюдо
          </Link>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Цена</th>
                <th>Категория</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.item_id}>
                  <td>{item.item_id}</td>
                  <td>{item.name}</td>
                  <td>{item.price} ₽</td>
                  <td>{item.category_id}</td>
                  <td className="actions-cell">
                    <Link 
                      href={`/admin/menuitems_table/${item.item_id}/edit`}
                      className="edit-link"
                    >
                      Редактировать
                    </Link>
                    <button 
                      onClick={() => handleDelete(item.item_id)}
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
      </main>
    </div>
  )
}