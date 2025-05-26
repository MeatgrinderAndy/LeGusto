const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, authorizeAdmin } = require('../utils/authMiddleware');

router.get('/', authenticate, async (req, res) => {
try {
    const query = "SELECT * FROM tables_table WHERE status = 'Available'";
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function getAvailableTables(req, res) {
    try {
      console.log(req.query)
        const { date, time, duration = 2 } = req.query; // По умолчанию 2 часа
        
        if (!date || !time) {
            return res.status(400).json({ error: 'Необходимо указать дату и время' });
        }

        // Проверяем валидность даты и времени
        const reservationDateTime = new Date(`${date}T${time}`);
        console.log(reservationDateTime)
        if (isNaN(reservationDateTime.getTime())) {
            return res.status(400).json({ error: 'Некорректная дата или время' });
        }

        // Проверяем валидность длительности
        const durationHours = parseFloat(duration);
        if (isNaN(durationHours)) {
            return res.status(400).json({ error: 'Некорректная длительность бронирования' });
        }

        // Вычисляем время окончания брони
        const endDateTime = new Date(reservationDateTime.getTime() + durationHours * 60 * 60 * 1000);

        // Запрос для получения доступных столов
        const query = `
            SELECT t.*
            FROM tables_table t
            WHERE t.table_id NOT IN (
                SELECT r.table_id
                FROM reservations_table r
                WHERE 
                    (r.reservation_date <= $2 AND 
                     r.reservation_date + (r.duration * INTERVAL '1 hour') >= $1)
                    AND r.reservation_status != 'cancelled'
            )
            ORDER BY t.capacity;
        `;

        const result = await pool.query(query, [reservationDateTime, endDateTime]);

        res.json({
            available_tables: result.rows,
            date: date,
            time: time,
            duration: durationHours,
            total_available: result.rowCount
        });
        console.log(result.rows)
    } catch (error) {
        console.error('Ошибка при проверке доступных столов:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера при проверке доступных столов',
            details: error.message
        });
    }
}

router.get('/available', authenticate, async (req, res) => {
    try {
        await getAvailableTables(req, res); // Просто проксируем req и res
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
