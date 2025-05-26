"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './my_reservations.module.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function MyReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        console.log(userData)
        setUserData(userData);
      } catch (err) {
        router.push('/login');
      }
    }
  }, []);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user?.id) {
        router.push('/login');
        return;
        }
        console.log(user.id)
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:4000/api/reservations/user/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error(res.status === 404 
            ? 'Бронирования не найдены' 
            : 'Ошибка загрузки данных');
        }

        const data = await res.json();
        setReservations(data);
      } catch (err) {
        console.error('Ошибка:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [router]);
  
  const handleCancelReservation = async (reservationId) => {
    if (!confirm('Вы уверены, что хотите отменить это бронирование?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const res = await fetch(
        `http://localhost:4000/api/reservations/${reservationId}/cancel`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!res.ok) {
        throw new Error('Не удалось отменить бронирование');
      }

      // Обновляем список бронирований
      setReservations(reservations.map(r => 
        r.reservation_id === reservationId 
          ? { ...r, reservation_status: 'cancelled' } 
          : r
      ));
    } catch (err) {
      console.error('Ошибка отмены:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmed': return styles.statusConfirmed;
      case 'cancelled': return styles.statusCancelled;
      case 'completed': return styles.statusCompleted;
      default: return styles.statusPending;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
      <style>{'body{background-color: #121212}'}</style>

        <div className={styles.spinner}></div>
        <p>Загрузка ваших бронирований...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <style>{'body{background-color: #121212}'}</style>
        <p className={styles.errorText}>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className={styles.retryButton}
        >
          Обновить страницу
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header/>
      <style>{'body{background-color: #121212}'}</style>
      <header className={styles.header}>
        <h1>Мои бронирования</h1>
        {userData && (
          <div className={styles.userInfo}>
            <span>{userData.name || userData.email}</span>
          </div>
        )}
      </header>

      {reservations.length > 0 ? (
        <div className={styles.reservationsGrid}>
          {reservations
            .sort((a, b) => new Date(a.reservation_date) - new Date(b.reservation_date))
            .map((reservation) => (
              <div key={reservation.reservation_id} className={styles.reservationCard}>
                <div className={styles.cardHeader}>
                  <h3>Бронирование #{reservation.reservation_id}</h3>
                  <span className={`${styles.status} ${getStatusStyle(reservation.reservation_status)}`}>
                    {reservation.reservation_status}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Дата и время:</span>
                    <span>{formatDate(reservation.reservation_date)}</span>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Стол:</span>
                    <span>№{reservation.table_id} (до {reservation.capacity} чел.)</span>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Количество гостей:</span>
                    <span>{reservation.guests_number}</span>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Продолжительность:</span>
                    <span>{reservation.duration} часа</span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  {reservation.reservation_status === 'confirmed' && (
                    <button
                      onClick={() => handleCancelReservation(reservation.reservation_id)}
                      className={styles.cancelButton}
                      disabled={loading}
                    >
                      Отменить бронирование
                    </button>
                  )}
                </div>
              </div>
            ))}
            
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Header></Header>
          <img 
            src="/images/no-reservations.svg" 
            alt="Нет бронирований" 
            className={styles.emptyImage}
          />
          <h2>У вас пока нет бронирований</h2>
          <p>Забронируйте столик в нашем ресторане</p>
          <button
            onClick={() => router.push('/reservation')}
            className={styles.primaryButton}
          >
            Забронировать стол
          </button>
        </div>
      )}
     <Footer/>
     
    </div>
  );
}