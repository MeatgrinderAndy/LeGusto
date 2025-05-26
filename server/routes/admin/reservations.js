const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const { authenticate, authorizeAdmin } = require('../../utils/authMiddleware');

// Получить все бронирования
router.get('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, t.capacity
      FROM reservations_table r
      JOIN tables_table t ON r.table_id = t.table_id
      ORDER BY r.reservation_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// Обновить статус бронирования
router.put('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await pool.query(
      'UPDATE reservations_table SET reservation_status = $1 WHERE reservation_id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update reservation status' });
  }
});

// Получить бронирования пользователя
router.get('/user/:user_id', authenticate, authorizeAdmin, async (req, res) => {
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

// Отменить бронирование
router.put('/:id/cancel', authenticate, authorizeAdmin, async (req, res) => {
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

module.exports = router;