'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import "../../menuitem.css"

export default function EditMenuItem() {
  const router = useRouter()
  const params = useParams()
  const itemId = params.id
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    daily_buy: 0,
    monthly_buy: 0,
    yearly_buy: 0,
    total_buy: 0
  })
  const [categories, setCategories] = useState([])
  const [previewImage, setPreviewImage] = useState(null)
  const [currentImage, setCurrentImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
  const fetchData = async () => {
    try {
      const [itemRes, categoriesRes] = await Promise.all([
        fetch(`http://localhost:4000/api/admin/menuitems/${itemId}`),
        fetch('http://localhost:4000/api/admin/categories')
      ])

      if (!itemRes.ok) throw new Error('Failed to fetch menu item')
      if (!categoriesRes.ok) throw new Error('Failed to fetch categories')

      const [itemData, categoriesData] = await Promise.all([
        itemRes.json(),
        categoriesRes.json()
      ])

      setFormData({
        name: itemData.name,
        description: itemData.description,
        price: itemData.price,
        category_id: itemData.category_id,
        daily_buy: itemData.daily_buy,
        monthly_buy: itemData.monthly_buy,
        yearly_buy: itemData.yearly_buy,
        total_buy: itemData.total_buy
      })
      
      // Обработка изображения из полученных данных
      if (itemData.image) {
        // Проверяем, является ли image Buffer или массивом чисел
        const imageData = itemData.image.data ? itemData.image.data : itemData.image;
        const blob = new Blob([new Uint8Array(imageData)], { type: 'image/jpeg' })
        setCurrentImage(URL.createObjectURL(blob))
      }
      
      setCategories(categoriesData)
    } catch (err) {
      setError(err.message)
      console.error('Error:', err)
    } finally {
      setIsFetching(false)
    }
  }

  fetchData()

  return () => {
    if (currentImage) {
      URL.revokeObjectURL(currentImage)
    }
  }
}, [itemId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }))
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('price', formData.price)
      formDataToSend.append('category_id', formData.category_id)
      formDataToSend.append('daily_buy', formData.daily_buy)
      formDataToSend.append('monthly_buy', formData.monthly_buy)
      formDataToSend.append('yearly_buy', formData.yearly_buy)
      formDataToSend.append('total_buy', formData.total_buy)
      
      if (formData.image) {
        formDataToSend.append('image', formData.image)
      }

      const response = await fetch(`http://localhost:4000/api/admin/menuitems/${itemId}`, {
        method: 'PUT',
        body: formDataToSend,
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      router.push('/admin/menuitems_table')
    } catch (err) {
      setError(err.message || 'Ошибка при обновлении блюда')
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="page-container">
        <style>{'body{background-color: #121212}'}</style>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка данных...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <style>{'body{background-color: #121212}'}</style>
        <div className="error-message">
          <svg className="error-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M13,17h-2v-2h2V17z M13,13h-2V7h2V13z"/>
          </svg>
          <p>{error}</p>
        </div>
        <Link href="/admin/menuitems_table" className="back-link">
          ← Вернуться к списку
        </Link>
      </div>
    )
  }

  return (
    <div className="page-container">
      <style>{'body{background-color: #121212}'}</style>
      
      <main className="admin-page">
        <div className="admin-header">
          <Link href="/admin/menuitems_table" className="back-link">
            ← Назад
          </Link>
          <h1 className="admin-title">
            <span className="title-gradient">Редактировать блюдо</span>
          </h1>
        </div>

        {error && (
          <div className="error-message">
            <svg className="error-icon" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M13,17h-2v-2h2V17z M13,13h-2V7h2V13z"/>
            </svg>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="name">
                Название блюда *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">
                Цена *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category_id">
                Категория *
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
              >
                <option value="">Выберите категорию</option>
                {categories.map(category => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 form-group">
              <label htmlFor="description">
                Описание
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <div className="md:col-span-2 form-group">
              <label htmlFor="image">
                Изображение блюда
              </label>
              <div className="image-upload-container">
                {previewImage ? (
                  <div className="image-preview">
                    <img 
                      src={previewImage} 
                      alt="Превью нового изображения" 
                      className="preview-image"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(null)
                        setFormData(prev => ({ ...prev, image: null }))
                      }}
                      className="remove-image-btn"
                    >
                      Удалить
                    </button>
                  </div>
                ) : currentImage ? (
                  <div className="image-preview">
                    <img 
                      src={currentImage} 
                      alt="Текущее изображение блюда" 
                      className="preview-image"
                    />
                    <label className="replace-image-btn">
                      Заменить
                      <input
                        type="file"
                        id="image"
                        name="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="upload-label">
                    <input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="upload-placeholder">
                      <svg className="upload-icon" viewBox="0 0 24 24">
                        <path fill="#666" d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z"/>
                      </svg>
                      <span>Выберите изображение</span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <div className="md:col-span-2 form-group">
              <h3 className="text-lg font-semibold mb-3">Статистика покупок</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="form-group">
                  <label htmlFor="daily_buy">
                    Дневные продажи
                  </label>
                  <input
                    type="number"
                    id="daily_buy"
                    name="daily_buy"
                    min="0"
                    value={formData.daily_buy}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="monthly_buy">
                    Месячные продажи
                  </label>
                  <input
                    type="number"
                    id="monthly_buy"
                    name="monthly_buy"
                    min="0"
                    value={formData.monthly_buy}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="yearly_buy">
                    Годовые продажи
                  </label>
                  <input
                    type="number"
                    id="yearly_buy"
                    name="yearly_buy"
                    min="0"
                    value={formData.yearly_buy}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="total_buy">
                    Всего продаж
                  </label>
                  <input
                    type="number"
                    id="total_buy"
                    name="total_buy"
                    min="0"
                    value={formData.total_buy}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => router.push('/admin/menuitems_table')}
              className="cancel-btn"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="submit-btn"
            >
              {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}