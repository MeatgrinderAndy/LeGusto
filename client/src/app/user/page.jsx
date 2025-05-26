"use client"
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import './user.css';
import Header from '@/components/Header';

export default function ProfilePage() {
  const [user, setUser] = useState({
    user_id: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    order_amount: 0,
    orders_price: 0,
    vip: false,
    is_admin: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState({ 
    first: '', 
    last: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login?redirect=/profile');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (!parsedUser?.id) {
        throw new Error('Invalid user data');
      }
      
      const fetchUserData = async () => {
        try {
          const response = await fetch(`http://localhost:4000/api/user/${parsedUser.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data);
            setTempData({ 
              first: data.first_name, 
              last: data.last_name,
              email: data.email || ''
            });
          } else {
            throw new Error('Failed to fetch user data');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchUserData();
    } catch (e) {
      console.error('Error parsing user data:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login?redirect=/profile');
    }
  }, [router]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTempData({ 
      first: user.first_name, 
      last: user.last_name,
      email: user.email || ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/users/${user.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: tempData.first,
          last_name: tempData.last,
          phone: user.phone,
          email: tempData.email
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditing(false);
        
        // Обновляем данные в localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          parsedUser.first_name = updatedUser.first_name;
          parsedUser.last_name = updatedUser.last_name;
          parsedUser.email = updatedUser.email;
          localStorage.setItem('user', JSON.stringify(parsedUser));
        }
      } else {
        console.error('Failed to update user data');
      }
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempData(prev => ({ ...prev, [name]: value }));
  };

  const navigateTo = (path) => {
    router.push(path);
  };

  if (isLoading) {
    return (
      <div className="loadingScreen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <style>{'body { background-color: #121212; }'}</style>
      
      <Head>
        <title>Профиль пользователя | {user.first_name} {user.last_name}</title>
        <meta name="description" content="Ваш профиль пользователя" />
      </Head>

      <div className="profilePage">
        <section className="heroSection">
          <div className="heroBackground"></div>
          <div className="heroContainer">
            <div className="heroContent">
              <h1 className="heroTitle">
                <span className="titleGradient">Добро пожаловать, {user.first_name}!</span>
              </h1>
              <p className="heroSubtitle">
                Здесь вы можете управлять своим профилем и просматривать статистику.
              </p>
            </div>
          </div>
        </section>

        <section className="aboutSection">
          <div className="aboutContainer">
            <div className="sectionTitle">
              <h2 className="titleDecoration">Личная информация</h2>
            </div>
            <div className="aboutContent">
              <div className="profileInfo">
                {isEditing ? (
                  <div className="editForm">
                    <div className="formGroup">
                      <label>Имя:</label>
                      <input
                        type="text"
                        name="first"
                        value={tempData.first}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="formGroup">
                      <label>Фамилия:</label>
                      <input
                        type="text"
                        name="last"
                        value={tempData.last}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="formGroup">
                      <label>Email:</label>
                      <input
                        type="email"
                        name="email"
                        value={tempData.email}
                        onChange={handleInputChange}
                        placeholder={user.email ? '' : 'Укажите ваш email'}
                      />
                    </div>
                    <div className="formActions">
                      <button className="saveBtn" onClick={handleSaveEdit}>
                        Сохранить
                      </button>
                      <button className="cancelBtn" onClick={handleCancelEdit}>
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="infoRow">
                      <span className="infoLabel">Имя:</span>
                      <span className="infoValue">{user.first_name}</span>
                    </div>
                    <div className="infoRow">
                      <span className="infoLabel">Фамилия:</span>
                      <span className="infoValue">{user.last_name}</span>
                    </div>
                    <div className="infoRow">
                      <span className="infoLabel">Email:</span>
                      <span className="infoValue">
                        {user.email || (
                          <span 
                            style={{color: '#febe00', cursor: 'pointer'}} 
                            onClick={() => setIsEditing(true)}
                          >
                            Указать email
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="infoRow">
                      <span className="infoLabel">Телефон:</span>
                      <span className="infoValue">{user.phone || 'Не указан'}</span>
                    </div>
                    <button className="editBtn" onClick={handleEditClick}>
                      Редактировать профиль
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="featureSection dark">
          <div className="featureContainer">
            <div className="featureText left">
              <h3>Ваша статистика</h3>
              <div className="statsGrid">
                <div className="statCard">
                  <div className="statValue">{user.order_amount}</div>
                  <div className="statLabel">Всего заказов</div>
                </div>
                <div className="statCard">
                  <div className="statValue">
                    {typeof user.orders_price === 'number' 
                      ? user.orders_price.toFixed(2) 
                      : parseFloat(user.orders_price || 0).toFixed(2)} ₽
                  </div>
                  <div className="statLabel">Общая сумма</div>
                </div>
                <div className="statCard">
                  <div className="statValue">{user.vip ? 'Да' : 'Нет'}</div>
                  <div className="statLabel">VIP статус</div>
                </div>
              </div>
            </div>
           
          </div>
        </section>

        {/* Actions Section */}
        <section className="featureSection">
          <div className="featureContainer reverse">
            <div className="featureText right">
              <h3>Быстрые действия</h3>
              <div className="actionButtons">
                <button 
                  className="actionBtn "
                  onClick={() => navigateTo('/orders')}
                >
                  <span>Мои заказы</span>
                </button>
                <button 
                  className="actionBtn " 
                  onClick={() => navigateTo('/my_reservations')}
                >
                  <span>Мои бронирования</span>
                </button>
                {user.is_admin && (
                  <button 
                    className="actionBtn adminBtn " 
                    onClick={() => navigateTo('/admin')}
                  >
                    <span>Админ панель</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}