'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import './statistics.css'

export default function MenuStatistics() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [timeRange, setTimeRange] = useState('daily')
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })

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

  useEffect(() => {
    if (isAdmin) {
      fetchData()
    }
  }, [isAdmin, timeRange])

  const fetchData = async () => {
    setIsDataLoading(true)
    try {
      const [menuResponse, categoriesResponse] = await Promise.all([
        fetch('http://localhost:4000/api/admin/menuitems'),
        fetch('http://localhost:4000/api/admin/categories')
      ])

      if (!menuResponse.ok) throw new Error('Failed to fetch menu items')
      if (!categoriesResponse.ok) throw new Error('Failed to fetch categories')

      const [menuItemsData, categoriesData] = await Promise.all([
        menuResponse.json(),
        categoriesResponse.json()
      ])

      setCategories(categoriesData)
      processStatistics(menuItemsData, categoriesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsDataLoading(false)
    }
  }

  const processStatistics = (menuItemsData, categoriesData) => {
    const processedItems = menuItemsData.map(item => ({
      ...item,
      current_buys: getBuyCount(item, timeRange),
      current_revenue: getBuyCount(item, timeRange) * item.price,
      category_name: categoriesData.find(cat => cat.category_id === item.category_id)?.category_name || 'Без категории'
    }))

    setMenuItems(processedItems)

    const topItems = [...processedItems]
      .sort((a, b) => b.current_buys - a.current_buys)
      .slice(0, 5)

    const categoryStats = categoriesData.map(category => {
      const categoryItems = processedItems.filter(item => item.category_id === category.category_id)
      const totalBuys = categoryItems.reduce((sum, item) => sum + item.current_buys, 0)
      const totalAllBuys = processedItems.reduce((sum, item) => sum + item.current_buys, 0)
      
      return {
        category_id: category.category_id,
        category_name: category.category_name,
        total_buys: totalBuys,
        percentage: totalAllBuys > 0 ? Math.round((totalBuys / totalAllBuys) * 100) : 0
      }
    }).filter(cat => cat.total_buys > 0)
    .sort((a, b) => b.total_buys - a.total_buys)

    // Общая статистика
    const totalBuys = processedItems.reduce((sum, item) => sum + item.current_buys, 0)
    const totalRevenue = processedItems.reduce((sum, item) => sum + item.current_revenue, 0)
    const averageItemRevenue = totalBuys > 0 ? (totalRevenue / totalBuys).toFixed(2) : 0

    setStats({
      top_items: topItems,
      category_stats: categoryStats,
      total_buys: totalBuys,
      average_item_revenue: averageItemRevenue,
      total_revenue: totalRevenue
    })
  }

  const getBuyCount = (item, range) => {
    switch(range) {
      case 'daily': return item.daily_buy || 0
      case 'monthly': return item.monthly_buy || 0
      case 'yearly': return item.yearly_buy || 0
      case 'total': return item.total_buy || 0
      default: return item.daily_buy || 0
    }
  }

  const getRangeLabel = () => {
    switch(timeRange) {
      case 'daily': return 'за день'
      case 'monthly': return 'за месяц'
      case 'yearly': return 'за год'
      case 'total': return 'за всё время'
      default: return ''
    }
  }

  const requestSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedItems = [...menuItems].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1
    }
    return 0
  })

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

  return (
    <div className="page-container">
      <style>{'body{background-color: #121212}'}</style>
      
      <main className="admin-page">
        <div className="admin-header">
          <Link href="/admin" className="back-link">
            ← Назад в панель
          </Link>
          <h1 className="admin-title">
            <span className="title-gradient">Статистика меню</span>
          </h1>
          <p className="admin-subtitle">Анализ популярности блюд {getRangeLabel()}</p>
        </div>

        <div className="statistics-controls">
          <div className="time-range-selector">
            <label>Период:</label>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="range-select"
            >
              <option value="daily">День</option>
              <option value="monthly">Месяц</option>
              <option value="yearly">Год</option>
              <option value="total">Все время</option>
            </select>
          </div>
          <button 
            onClick={fetchData}
            disabled={isDataLoading}
            className="refresh-btn"
          >
            {isDataLoading ? 'Обновление...' : 'Обновить'}
          </button>
        </div>

        {isDataLoading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Загрузка статистики...</p>
          </div>
        ) : stats ? (
          <>
            <div className="statistics-grid">
              <div className="statistics-card">
                <h3>Топ-5 популярных блюд</h3>
                <div className="top-items">
                  {stats.top_items.map((item, index) => (
                    <div key={item.item_id} className="top-item">
                      <span className="item-rank">{index + 1}</span>
                      <span className="item-name">{item.name}</span>
                      <span className="item-count">{item.current_buys} покупок</span>
                      <span className="item-revenue">{item.current_revenue} ₽</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="statistics-card">
                <h3>Статистика по категориям</h3>
                <div className="category-stats">
                  {stats.category_stats.map(category => (
                    <div key={category.category_id} className="category-stat">
                      <span className="category-name">{category.category_name}</span>
                      <div className="stat-bar-container">
                        <div 
                          className="stat-bar" 
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                        <span className="stat-value">{category.percentage}%</span>
                      </div>
                      <span className="stat-count">{category.total_buys} покупок</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="statistics-card wide">
                <h3>Общая статистика</h3>
                <div className="sales-stats">
                  <div className="stat-item">
                    <span className="stat-label">Всего покупок:</span>
                    <span className="stat-value">{stats.total_buys}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Средний доход с позиции:</span>
                    <span className="stat-value">{stats.average_item_revenue} ₽</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Общий доход:</span>
                    <span className="stat-value">{stats.total_revenue} ₽</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="full-stats-table">
              <h3 className="section-title">
                <span className="title-gradient">Детальная статистика по позициям</span>
              </h3>
              <div className="table-container">
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th onClick={() => requestSort('name')}>
                        Название {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => requestSort('category_name')}>
                        Категория {sortConfig.key === 'category_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => requestSort('current_buys')}>
                        Покупки {sortConfig.key === 'current_buys' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => requestSort('price')}>
                        Цена {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => requestSort('current_revenue')}>
                        Доход {sortConfig.key === 'current_revenue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Дневные</th>
                      <th>Месячные</th>
                      <th>Годовые</th>
                      <th>Всего</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedItems.map(item => (
                      <tr key={item.item_id}>
                        <td>{item.name}</td>
                        <td>{item.category_name}</td>
                        <td>{item.current_buys}</td>
                        <td>{item.price} ₽</td>
                        <td>{item.current_revenue} ₽</td>
                        <td>{item.daily_buy}</td>
                        <td>{item.monthly_buy}</td>
                        <td>{item.yearly_buy}</td>
                        <td>{item.total_buy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="no-data">Нет данных для отображения</div>
        )}
      </main>
    </div>
  )
}