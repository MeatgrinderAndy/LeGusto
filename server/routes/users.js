const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../utils/authMiddleware');

// Получить данные пользователя
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, что пользователь запрашивает свои данные или это админ
    if (req.user.userId !== parseInt(id) && !req.user.is_admin) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const query = 'SELECT * FROM users_table WHERE user_id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const userData = result.rows[0];
    res.status(200).json({
      id: userData.user_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone,
      email: userData.email,
      order_amount: Number(userData.order_amount),
      orders_price: Number(userData.orders_price),
      vip: userData.vip,
      is_admin: userData.is_admin
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить данные пользователя
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, что пользователь обновляет свои данные или это админ
    if (req.user.userId !== parseInt(id) && !req.user.is_admin) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const { first_name, last_name, phone, email } = req.body;
  
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Некорректный email' });
    }

    const query = `
      UPDATE users_table 
      SET first_name = $1, last_name = $2, phone = $3, email = $4
      WHERE user_id = $5
      RETURNING user_id, first_name, last_name, phone, email, order_amount, orders_price, vip, is_admin
    `;

    const values = [first_name, last_name, phone, email, id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при обновлении пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить заказы пользователя
router.get('/:id/orders', authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Проверяем права доступа
    if (req.user.userId !== userId && !req.user.is_admin) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const query = `
      SELECT 
        o.order_id,
        o.order_date,
        o.total_price,
        o.status,
        json_agg(
          json_build_object(
            'order_item_id', oi.order_item_id,
            'item_id', oi.item_id,
            'name', m.name,
            'description', m.description,
            'quantity', oi.quantity,
            'price', oi.pos_price,
            'image', m.image
          ) ORDER BY oi.order_item_id
        ) AS items
      FROM orders_table o
      JOIN orderitems_table oi ON o.order_id = oi.order_id
      JOIN menuitems_table m ON oi.item_id = m.item_id
      WHERE o.user_id = $1
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
    `;

    const { rows: orders } = await pool.query(query, [userId]);

    const formattedOrders = orders.map(order => ({
      order_id: order.order_id,
      created_at: order.order_date,
      total_price: parseFloat(order.total_price),
      status: order.status || 'pending',
      items: order.items.map(item => ({
        order_item_id: item.order_item_id,
        item_id: item.item_id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        price: parseFloat(item.price),
        image: item.image ? {
          data: item.image.toString('base64'),
          contentType: 'image/jpeg'
        } : null
      }))
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Ошибка при получении заказов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;