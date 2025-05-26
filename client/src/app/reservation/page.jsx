"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './reservation.module.css';
import Header from '@/components/Header';

export default function Page() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tables, setTables] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [formData, setFormData] = useState({
    table_id: '',
    reservation_date: '',
    reservation_time: '',
    duration: '2',
    guests: 2
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        setUser(userData);
        fetchTables();
      } catch (err) {
        router.push('/login');
      }
    }
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/tables');
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      } else {
        throw new Error('Failed to fetch tables');
      }
    } catch (err) {
      setError('Не удалось загрузить информацию о столах');
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    const openingHour = 11;
    const closingHour = 23;
    
    for (let hour = openingHour; hour < closingHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    
    return slots;
  };

  const checkAvailableTables = async () => {
  if (!formData.reservation_date || !formData.reservation_time) return;

  try {
    setLoading(true);
    const response = await fetch(
      `http://localhost:4000/api/tables/available?date=${formData.reservation_date}&time=${formData.reservation_time}`
    );

    if (response.ok) {
      const data = await response.json();
      console.log('Available tables response:', data);

      // Извлекаем массив столов
      const tables = Array.isArray(data.available_tables) ? data.available_tables : [];

      setAvailableTables(tables);

      if (formData.table_id && !tables.some(t => t.table_id === formData.table_id)) {
        setFormData(prev => ({ ...prev, table_id: '' }));
      }
    } else {
      throw new Error('Failed to check available tables');
    }
  } catch (err) {
    setError('Не удалось проверить доступные столы');
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    if (formData.reservation_date && formData.reservation_time) {
      checkAvailableTables();
    }
  }, [formData.reservation_date, formData.reservation_time]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'reservation_date') {
      setFormData(prev => ({ ...prev, reservation_time: '' }));
      setAvailableTimeSlots(generateTimeSlots());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.table_id || !formData.reservation_date || !formData.reservation_time) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const dateTime = `${formData.reservation_date}T${formData.reservation_time}`;
      
      const response = await fetch('http://localhost:4000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          table_id: formData.table_id,
          reservation_date: dateTime,
          duration: formData.duration,
          guests: formData.guests
        })
      });
      
      if (response.ok) {
        setSuccess('Столик успешно забронирован!');
        setFormData({
          table_id: '',
          reservation_date: '',
          reservation_time: '',
          duration: '2',
          guests: 2
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при бронировании');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTables = availableTables.filter(table => 
    table.capacity >= formData.guests
  );

  return (
    <div className={styles.container}>
      <Header></Header>
        <style>{'body { background-color: #121212 }'}</style>
      
      <main className={styles.main}>
        <h1 className={styles.title}>Бронирование столика</h1>
        
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="reservation_date">Дата бронирования:</label>
            <input
              type="date"
              id="reservation_date"
              name="reservation_date"
              value={formData.reservation_date}
              onChange={handleInputChange}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          {formData.reservation_date && (
            <div className={styles.formGroup}>
              <label htmlFor="reservation_time">Время бронирования:</label>
              <select
                id="reservation_time"
                name="reservation_time"
                value={formData.reservation_time}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Выберите время --</option>
                {availableTimeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className={styles.formGroup}>
            <label htmlFor="guests">Количество гостей:</label>
            <select
              id="guests"
              name="guests"
              value={formData.guests}
              onChange={handleInputChange}
              required
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="duration">Продолжительность:</label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              required
            >
              {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(hours => (
                <option key={hours} value={hours}>{hours} {hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}</option>
              ))}
            </select>
          </div>
          
          {formData.reservation_date && formData.reservation_time && (
            <div className={styles.formGroup}>
              <label htmlFor="table_id">Выберите столик:</label>
              {loading ? (
                <p>Загрузка доступных столов...</p>
              ) : filteredTables.length > 0 ? (
                <select
                  id="table_id"
                  name="table_id"
                  value={formData.table_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Выберите столик --</option>
                  {filteredTables.map(table => (
                    <option key={table.table_id} value={table.table_id}>
                      Стол №{table.table_id} (Вместимость: {table.capacity})
                    </option>
                  ))}
                </select>
              ) : (
                <p>Нет доступных столов на выбранную дату и время</p>
              )}
            </div>
          )}
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading || !formData.table_id}
          >
            {loading ? 'Обработка...' : 'Забронировать'}
          </button>
        </form>
      </main>
    </div>
  );
}
// "use client"
// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import Head from 'next/head';
// import styles from './reservation.module.css';

// export default function ReservationPage() {
//   const router = useRouter();
//   const [user, setUser] = useState(null);
//   const [tables, setTables] = useState([]);
//   const [availableTables, setAvailableTables] = useState([]);
//   const [formData, setFormData] = useState({
//     table_id: '',
//     reservation_date: '',
//     duration: '2', // Default duration set to 2 hours
//     guests: 2
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');

//   // Check user authentication
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       router.push('/login');
//     } else {
//       try {
//         const userData = JSON.parse(localStorage.getItem('user'));
//         setUser(userData);
//         fetchTables();
//       } catch (err) {
//         router.push('/login');
//       }
//     }
//   }, []);

//   // Fetch all tables
//   const fetchTables = async () => {
//     try {
//       const response = await fetch('http://localhost:4000/api/tables');
//       if (response.ok) {
//         const data = await response.json();
//         setTables(data);
//       } else {
//         throw new Error('Failed to fetch tables');
//       }
//     } catch (err) {
//       setError('Не удалось загрузить информацию о столах');
//     }
//   };

//   // Check available tables for selected date
//   const checkAvailableTables = async () => {
//     if (!formData.reservation_date) return;
    
//     try {
//       setLoading(true);
//       const response = await fetch(
//         `http://localhost:4000/api/tables`
//       );
      
//       if (response.ok) {
//         const data = await response.json();
//         setAvailableTables(data);
        
//         // If selected table is not available, reset selection
//         if (formData.table_id && !data.some(t => t.table_id === formData.table_id)) {
//           setFormData(prev => ({ ...prev, table_id: '' }));
//         }
//       } else {
//         throw new Error('Failed to check available tables');
//       }
//     } catch (err) {
//       setError('Не удалось проверить доступные столы');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     checkAvailableTables();
//   }, [formData.reservation_date]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setSuccess('');
    
//     if (!formData.table_id || !formData.reservation_date) {
//       setError('Пожалуйста, заполните все обязательные поля');
//       return;
//     }
    
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
      
//       const response = await fetch('http://localhost:4000/api/reservations', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({
//           table_id: formData.table_id,
//           reservation_date: formData.reservation_date,
//           duration: formData.duration,
//           guests: formData.guests
//         })
//       });
      
//       if (response.ok) {
//         setSuccess('Столик успешно забронирован!');
//         setFormData({
//           table_id: '',
//           reservation_date: '',
//           duration: '2', // Reset to default 2 hours
//           guests: 2
//         });
//       } else {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Ошибка при бронировании');
//       }
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Filter tables by capacity
//   const filteredTables = availableTables.filter(table => 
//     table.capacity >= formData.guests
//   );

//   return (
//     <div className={styles.container}>
//       <Head>
//         <title>Бронирование столика | Gusto</title>
//         <meta name="description" content="Забронируйте столик в ресторане Gusto" />
//       </Head>
      
//       <main className={styles.main}>
//         <h1 className={styles.title}>Бронирование столика</h1>
        
//         {error && <div className={styles.error}>{error}</div>}
//         {success && <div className={styles.success}>{success}</div>}
        
//         <form onSubmit={handleSubmit} className={styles.form}>
//           <div className={styles.formGroup}>
//             <label htmlFor="reservation_date">Дата и время бронирования:</label>
//             <input
//               type="datetime-local"
//               id="reservation_date"
//               name="reservation_date"
//               value={formData.reservation_date}
//               onChange={handleInputChange}
//               required
//               min={new Date().toISOString().slice(0, 16)}
//             />
//           </div>
          
//           <div className={styles.formGroup}>
//             <label htmlFor="guests">Количество гостей:</label>
//             <select
//               id="guests"
//               name="guests"
//               value={formData.guests}
//               onChange={handleInputChange}
//               required
//             >
//               {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
//                 <option key={num} value={num}>{num}</option>
//               ))}
//             </select>
//           </div>
          
//           <div className={styles.formGroup}>
//             <label htmlFor="duration">Продолжительность (часы):</label>
//             <select
//               id="duration"
//               name="duration"
//               value={formData.duration}
//               onChange={handleInputChange}
//               required
//             >
//               {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(hours => (
//                 <option key={hours} value={hours}>{hours} {hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}</option>
//               ))}
//             </select>
//           </div>
          
//           {formData.reservation_date && (
//             <div className={styles.formGroup}>
//               <label htmlFor="table_id">Выберите столик:</label>
//               {loading ? (
//                 <p>Загрузка доступных столов...</p>
//               ) : filteredTables.length > 0 ? (
//                 <select
//                   id="table_id"
//                   name="table_id"
//                   value={formData.table_id}
//                   onChange={handleInputChange}
//                   required
//                 >
//                   <option value="">-- Выберите столик --</option>
//                   {filteredTables.map(table => (
//                     <option key={table.table_id} value={table.table_id}>
//                       Стол №{table.table_id} (Вместимость: {table.capacity})
//                     </option>
//                   ))}
//                 </select>
//               ) : (
//                 <p>Нет доступных столов на выбранную дату</p>
//               )}
//             </div>
//           )}
          
//           <button 
//             type="submit" 
//             className={styles.submitButton}
//             disabled={loading || !formData.table_id}
//           >
//             {loading ? 'Обработка...' : 'Забронировать'}
//           </button>
//         </form>
//       </main>
//     </div>
//   );
// }