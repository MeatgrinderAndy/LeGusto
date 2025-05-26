'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import '../../category.css'

export default function EditCategory() {
  const router = useRouter()
  const params = useParams()
  const categoryId = params.id
  const [formData, setFormData] = useState({
    category_name: '',
    category_description: '',
    image: null
  })
  const [previewImage, setPreviewImage] = useState(null)
  const [currentImage, setCurrentImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/admin/categories/${categoryId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch category')
        }

        const categoryData = await response.json()
        setFormData({
          category_name: categoryData.category_name,
          category_description: categoryData.category_description
        })
        
        // Обработка изображения из полученных данных
        if (categoryData.image) {
          // Проверяем, является ли image Buffer или массивом чисел
          const imageData = categoryData.image.data ? categoryData.image.data : categoryData.image;
          const blob = new Blob([new Uint8Array(imageData)], { type: 'image/jpeg' })
          setCurrentImage(URL.createObjectURL(blob))
        }
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
  }, [categoryId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      formDataToSend.append('category_name', formData.category_name)
      formDataToSend.append('category_description', formData.category_description)
      if (formData.image) {
        formDataToSend.append('image', formData.image)
      }

      const response = await fetch(`http://localhost:4000/api/admin/categories/${categoryId}`, {
        method: 'PUT',
        body: formDataToSend,
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      router.push('/admin/category_table')
    } catch (err) {
      setError(err.message || 'Ошибка при обновлении категории')
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
        <Link href="/admin/category_table" className="back-link">
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
          <Link href="/admin/category_table" className="back-link">
            ← Назад
          </Link>
          <h1 className="admin-title">
            <span className="title-gradient">Редактировать категорию</span>
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
          <div className="form-group">
            <label htmlFor="category_name">
              Название категории *
            </label>
            <input
              type="text"
              id="category_name"
              name="category_name"
              value={formData.category_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category_description">
              Описание
            </label>
            <textarea
              id="category_description"
              name="category_description"
              value={formData.category_description}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">
              Изображение категории
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
                    alt="Текущее изображение категории" 
                    className="preview-image"
                    onError={(e) => {
                      e.target.src = '/default-category.jpg'
                      e.target.onerror = null
                    }}
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

          <div className="form-actions">
            <button
              type="button"
              onClick={() => router.push('/admin/category_table')}
              className="cancel-btn"
            >
              Отмена
            </button>
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