const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../utils/authMiddleware');

// Создать бронирование
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { table_id, reservation_date, duration, guests } = req.body;
    
    if (!table_id || !reservation_date || !duration || !guests) {
      return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
    }

    const durationHours = parseInt(duration);
    const startDate = new Date(reservation_date);
    const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

    // Проверка доступности стола
    const availabilityCheck = await pool.query(
      `SELECT * FROM reservations_table 
       WHERE table_id = $1 
       AND reservation_status NOT IN ('cancelled', 'expired')
       AND (
         (reservation_date BETWEEN $2 AND $3)
         OR 
         (reservation_date + (duration * interval '1 hour') BETWEEN $2 AND $3)
         OR
         ($2 BETWEEN reservation_date AND reservation_date + (duration * interval '1 hour'))
       )`,
      [table_id, startDate, endDate]
    );
    
    if (availabilityCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Стол уже забронирован на это время' });
    }

    const query = `
      INSERT INTO reservations_table 
        (user_id, table_id, reservation_date, duration, guests_number, reservation_status)
      VALUES ($1, $2, $3, $4, $5, 'confirmed')
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      userId,
      table_id,
      startDate,
      durationHours,
      guests
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании бронирования' });
  }
});

router.get('/user/:user_id', authenticate, async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const result = await pool.query(
      `SELECT r.*, t.capacity 
       FROM reservations_table r
       JOIN tables_table t ON r.table_id = t.table_id
       WHERE r.user_id = $1
       ORDER BY r.reservation_date DESC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user reservations' });
  }
});

router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE reservations_table 
       SET reservation_status = 'cancelled'
       WHERE reservation_id = $1
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
});

router.get('/waiters', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT employee_id, first_name, last_name 
      FROM employees_table
      WHERE position_id = (SELECT position_id FROM positions_table WHERE position_name = 'Официант')
      ORDER BY last_name, first_name
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch waiters' });
  }
});

module.exports = router;