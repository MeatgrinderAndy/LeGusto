const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const { authenticate, authorizeAdmin } = require('../../utils/authMiddleware');

router.get('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const query = 'SELECT * FROM users_table order by user_id';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, authorizeAdmin, async (req, res) => {
try {
    const query = 'SELECT * FROM users_table WHERE user_id = $1';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const ordersResult = await client.query('SELECT order_id FROM orders_table WHERE user_id = $1', [id]);
    const orderIds = ordersResult.rows.map(order => order.order_id);

    if (orderIds.length > 0) {
      await client.query('DELETE FROM orderitems_table WHERE order_id = ANY($1::int[])', [orderIds]);
    }

    await client.query('DELETE FROM orders_table WHERE user_id = $1', [id]);
    await client.query('DELETE FROM reservations_table WHERE user_id = $1', [id]);
    const userResult = await client.query('DELETE FROM users_table WHERE user_id = $1 RETURNING *', [id]);

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'User and related data deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
