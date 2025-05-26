'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import "../menuitem.css"

export default function CreateMenuItem() {
  const router = useRouter()
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [image, setImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)

  useState(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/admin/categories')
        const data = await res.json()
        setCategories(data)
      } catch (err) {
        console.error('Failed to load categories:', err)
      }
    }
    fetchCategories()
  }, [])

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
      setImage(file)
      
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
      if (image) {
        formDataToSend.append('image', image)
      }

      const response = await fetch('http://localhost:4000/api/admin/menuitems', {
        method: 'POST',
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to create menu item')
      }

      router.push('/admin/menuitems_table')
    } catch (err) {
      setError(err.message)
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-container">
      <main className="admin-page">
        <div className="admin-header">
          <Link href="/admin/menuitems_table" className="back-link">
            ← Назад к списку
          </Link>
          <h1 className="admin-title">
            <span className="title-gradient">Добавить новое блюдо</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                      alt="Превью изображения" 
                      className="preview-image"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage(null)
                          setImage(null)
                        }}
                        className="remove-image-btn"
                      >
                        Удалить
                      </button>
                      <label className="replace-image-btn">
                        Заменить
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="upload-label">
                    <div className="upload-placeholder">
                      <svg className="upload-icon" viewBox="0 0 24 24">
                        <path fill="#666" d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z"/>
                      </svg>
                      <span>Выберите изображение</span>
                    </div>
                    <input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={isLoading}
              className="submit-btn"
            >
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}