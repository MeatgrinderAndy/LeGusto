'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import './admin.css'

export default function AdminPanel() {
    const router = useRouter()
    const [isAdmin, setIsAdmin] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
  
    useEffect(() => {
      const user = localStorage.getItem('user')
      if (user) {
        try {
          const userData = JSON.parse(user)
          const adminStatus = userData.is_admin === true
          setIsAdmin(adminStatus)
          
          if (!adminStatus) {
            router.push('/')
          }
        } catch (e) {
          console.error('Error parsing user data:', e)
          router.push('/')
        }
      } else {
        router.push('/')
      }
      setIsLoading(false)
    }, [router])
  
    if (isLoading) {
      return (
        <div className="page-container">
          <style>{'body{background-color: #121212}'}</style>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Проверка прав доступа...</p>
          </div>
        </div>
      )
    }
  
    if (!isAdmin) {
      return null
    }

  const tables = [
    { 
      name: 'category_table', 
      label: 'Категории меню',
      description: 'Управление категориями для группировки блюд',
      icon: '📋'
    },
    { 
    name: 'menu_statistics', 
    label: 'Статистика меню',
    description: 'Анализ популярности блюд и напитков',
    icon: '📊'
    },
    { 
      name: 'menuitems_table', 
      label: 'Позиции меню',
      description: 'Управление блюдами и напитками',
      icon: '🍽️'
    },
    { 
      name: 'orders_table', 
      label: 'Заказы',
      description: 'Управление заказами клиентов',
      icon: '🛒'
    },
    { 
      name: 'employees_table', 
      label: 'Сотрудники',
      description: 'Управление данными сотрудников',
      icon: '👨‍🍳'
    },
    { 
      name: 'positions_table', 
      label: 'Должности',
      description: 'Управление должностями',
      icon: '💼'
    },
    { 
      name: 'reservations_table', 
      label: 'Бронирования',
      description: 'Управление бронированиями',
      icon: '🕒'
    },
    { 
      name: 'tables_table', 
      label: 'Столики',
      description: 'Управление столиками',
      icon: '🪑'
    },
    { 
      name: 'users_table', 
      label: 'Пользователи',
      description: 'Управление учетными записями',
      icon: '👤'
    }
  ]

  return (
    <div className="page-container">
      <style>{'body{background-color: #121212}'}</style>
      <a className="back-link" href="/">← Назад на главную</a>
      <main className="admin-page">
        <div className="admin-header">
          <h1 className="admin-title">
            <span className="title-gradient">Административная панель</span>
          </h1>
          <p className="admin-subtitle">Управление системой ресторана</p>
        </div>
        
        <div className="tables-grid">
          {tables.map((table) => (
            <Link 
              key={table.name}
              href={`/admin/${table.name}`}
              className="table-card"
            >
              <div className="table-icon">{table.icon}</div>
              <h2 className="table-title">{table.label}</h2>
              <p className="table-description">{table.description}</p>
              <div className="table-link">Управление →</div>
            </Link>
          ))}
        </div>

        <div className="quick-actions">
          <h2 className="section-title">
            <span className="title-gradient">Быстрые действия</span>
          </h2>
          <div className="actions-grid">
            <button 
              onClick={() => router.push('/admin/menuitems_table/create')}
              className="action-btn"
            >
              <span>➕</span> Добавить блюдо
            </button>
            <button 
              onClick={() => router.push('/admin/reservations_table')}
              className="action-btn"
            >
              <span>🕒</span> Бронирования
            </button>
            <button 
              onClick={() => router.push('/admin/menu_statistics')}
              className="action-btn"
            >
            <span>📈</span> Статистика продаж
            </button>
            <button 
              onClick={() => router.push('/admin/orders_table?status=pending')}
              className="action-btn"
            >
              <span>🆕</span> Новые заказы
            </button>
            
          </div>
        </div>
      </main>
    </div>
  )
}