const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const { authenticate, authorizeAdmin } = require('../../utils/authMiddleware');


// Получить все заказы с информацией о пользователях
router.get('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        o.order_id,
        o.user_id,
        u.first_name || ' ' || u.last_name as user_name,
        o.order_date,
        o.total_price,
        o.item_quantity,
        o.status,
        COUNT(oi.order_item_id) as items_count
      FROM orders_table o
      LEFT JOIN users_table u ON o.user_id = u.user_id
      LEFT JOIN orderitems_table oi ON o.order_id = oi.order_id
      GROUP BY o.order_id, u.first_name, u.last_name
      ORDER BY o.order_date DESC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить заказ по ID с деталями
router.get('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Основная информация о заказе
    const orderQuery = `
      SELECT 
        o.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.phone as user_phone
      FROM orders_table o
      LEFT JOIN users_table u ON o.user_id = u.user_id
      WHERE o.order_id = $1
    `;
    
    // Состав заказа
    const itemsQuery = `
      SELECT 
        oi.*,
        m.name as item_name,
        m.price as current_price
      FROM orderitems_table oi
      LEFT JOIN menuitems_table m ON oi.item_id = m.item_id
      WHERE oi.order_id = $1
    `;
    
    const [orderResult, itemsResult] = await Promise.all([
      pool.query(orderQuery, [id]),
      pool.query(itemsQuery, [id])
    ]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const orderData = {
      ...orderResult.rows[0],
      items: itemsResult.rows
    };
    
    res.status(200).json(orderData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновить статус заказа
router.put('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const query = `
      UPDATE orders_table
      SET status = $1
      WHERE order_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Удалить заказ
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Сначала удаляем элементы заказа
      await client.query(
        'DELETE FROM orderitems_table WHERE order_id = $1',
        [id]
      );
      
      // Затем удаляем сам заказ
      const result = await client.query(
        'DELETE FROM orders_table WHERE order_id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Order not found' });
      }
      
      await client.query('COMMIT');
      
      res.status(200).json({ 
        message: 'Order deleted successfully',
        deletedOrder: result.rows[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;