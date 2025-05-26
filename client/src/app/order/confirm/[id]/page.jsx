'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function OrderConfirmation() {
  const router = useRouter()
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const fetchOrder = async () => {
      try {
        setLoading(true)
        const response = await fetch(`http://localhost:4000/api/admin/orders/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Не удалось загрузить данные заказа')
        }

        const data = await response.json()
        setOrder(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-amber-800">Загрузка данных заказа...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Link href="/" className="text-amber-700 hover:underline">
          Вернуться на главную
        </Link>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Заказ не найден
        </div>
        <Link href="/" className="text-amber-700 hover:underline">
          Вернуться на главную
        </Link>
      </div>
    )
  }

  // Calculate total price
  const totalPrice = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  // Format order date
  const orderDate = new Date(order.created_at).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-amber-700 text-white px-6 py-4">
          <h1 className="text-2xl font-bold">Заказ успешно оформлен!</h1>
          <p className="mt-1">Спасибо за ваш заказ</p>
        </div>

        {/* Order details */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-amber-800 mb-2">Детали заказа</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600">Номер заказа:</div>
              <div className="font-medium">{order.order_id}</div>
              
              <div className="text-gray-600">Дата:</div>
              <div className="font-medium">{orderDate}</div>
              
              <div className="text-gray-600">Статус:</div>
              <div className="font-medium capitalize">
                <span className={`px-2 py-1 rounded ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {order.status === 'pending' ? 'в обработке' : 
                   order.status === 'completed' ? 'завершен' :
                   order.status === 'cancelled' ? 'отменен' : order.status}
                </span>
              </div>
              
              <div className="text-gray-600">Телефон:</div>
              <div className="font-medium">{order.phone}</div>
            </div>
          </div>

          {/* Order items */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-amber-800 mb-3">Состав заказа</h2>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Товар
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Кол-во
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Цена
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <tr key={item.item_id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium">{item.name}</div>
                        {item.notes && (
                          <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                        {item.price} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="2" className="px-4 py-3 text-right font-medium">
                      Итого:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-700">
                      {totalPrice} ₽
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {order.notes && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-amber-800 mb-2">Примечания</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">{order.notes}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link
              href="/"
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-center"
            >
              Вернуться в меню
            </Link>
            <Link
              href="/orders"
              className="px-6 py-3 border border-amber-600 text-amber-700 rounded-lg hover:bg-amber-50 font-medium text-center"
            >
              Мои заказы
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}