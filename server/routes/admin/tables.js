const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const { authenticate, authorizeAdmin } = require('../../utils/authMiddleware');

// Получить все столы с информацией о официантах
router.get('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, e.first_name, e.last_name
      FROM tables_table t
      LEFT JOIN employees_table e ON t.waiter = e.employee_id
      ORDER BY t.table_id
    `);
    
    const tables = result.rows.map(row => ({
      table_id: row.table_id,
      capacity: row.capacity,
      waiter: row.waiter ? `${row.first_name} ${row.last_name}` : null,
      waiter_id: row.waiter
    }));
    
    res.json(tables);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Получить стол по ID
router.get('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT t.*, e.first_name, e.last_name
      FROM tables_table t
      LEFT JOIN employees_table e ON t.waiter = e.employee_id
      WHERE t.table_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    const table = result.rows[0];
    res.json({
      table_id: table.table_id,
      capacity: table.capacity,
      waiter: table.waiter ? `${table.first_name} ${table.last_name}` : null,
      waiter_id: table.waiter
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch table' });
  }
});

// Создать новый стол
router.post('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { capacity, waiter } = req.body;
    
    if (!capacity || isNaN(capacity)) {
      return res.status(400).json({ error: 'Valid capacity is required' });
    }
    
    const result = await pool.query(
      'INSERT INTO tables_table (capacity, waiter) VALUES ($1, $2) RETURNING *',
      [capacity, waiter || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create table' });
  }
});

// Обновить стол
router.put('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { capacity, waiter } = req.body;
    
    if (!capacity || isNaN(capacity)) {
      return res.status(400).json({ error: 'Valid capacity is required' });
    }
    
    const result = await pool.query(
      'UPDATE tables_table SET capacity = $1, waiter = $2 WHERE table_id = $3 RETURNING *',
      [capacity, waiter || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update table' });
  }
});

// Удалить стол
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем существование стола
    const checkResult = await pool.query(
      'SELECT * FROM tables_table WHERE table_id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    // Удаляем стол
    await pool.query(
      'DELETE FROM tables_table WHERE table_id = $1',
      [id]
    );
    
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

// Получить всех официантов
router.get('/waiters', authenticate, authorizeAdmin, async (req, res) => {
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