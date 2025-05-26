const cron = require('node-cron');
const pool = require('../config/db');
const { transporter } = require('./emailServices');

cron.schedule('0 0 * * *', async () => {
  await pool.query('SELECT clear_daily_buy()');
});

cron.schedule('0 0 1 * *', async () => {
  await pool.query('SELECT clear_monthly_buy()');
});

cron.schedule('0 0 1 1 *', async () => {
  await pool.query('SELECT clear_yearly_buy()');
});

cron.schedule('0 5 * * *', async () => {
  await pool.query('SELECT clear_orders()');
});

cron.schedule('0 5 * * *', async () => {
  await pool.query('SELECT clear_old_reservations()');
});

cron.schedule('* * * * *', async () => {
  try {
    const query = `
      SELECT r.*, u.email, u.first_name 
      FROM reservations_table r
      JOIN users_table u ON r.user_id = u.user_id
      WHERE DATE(r.reservation_date) <= CURRENT_DATE + INTERVAL '1 day'
      AND r.reservation_status = 'confirmed'
      AND r.reminder_sent = false
      AND u.email IS NOT NULL
      AND u.email <> ''
    `;
    
    const result = await pool.query(query);
    const reservations = result.rows;
    let sentCount = 0;
    let skippedCount = 0;

    for (const reservation of reservations) {
      if (!reservation.email || reservation.email.trim() === '') {
        console.log(`Пропущено бронирование ${reservation.reservation_id} - email не указан`);
        skippedCount++;
        continue;
      }

      try {
        const reservationDate = new Date(reservation.reservation_date);
        const formattedDate = reservationDate.toLocaleDateString('ru-RU');
        const formattedTime = reservationDate.toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        await transporter.sendMail({
          from: '"Le Gusto" <no-reply@legusto.com>',
          to: reservation.email,
          subject: 'Напоминание о бронировании',
          html: `
            <h2>Уважаемый(ая) ${reservation.first_name},</h2>
            <p>Напоминаем, что завтра, ${formattedDate}, 
            у вас забронирован столик в нашем ресторане на ${formattedTime}.</p>
            <p>Количество гостей: ${reservation.guests_number}</p>
            <p>Номер бронирования: ${reservation.reservation_id}</p>
            <p>С уважением, команда Le Gusto</p>
          `
        });

        await pool.query(
          'UPDATE reservations_table SET reminder_sent = true WHERE reservation_id = $1',
          [reservation.reservation_id]
        );
        sentCount++;
      } catch (emailError) {
        console.error(`Ошибка при отправке письма для бронирования ${reservation.reservation_id}:`, emailError);
      }
    }
    
    console.log(`Отправлено ${sentCount} напоминаний, пропущено ${skippedCount} (email не указан)`);
  } catch (error) {
    console.error('Ошибка при отправке напоминаний:', error);
  }
});