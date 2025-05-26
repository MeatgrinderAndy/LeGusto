const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../utils/authMiddleware');


// Создание нового заказа
router.post('/', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { items } = req.body;
    const userId = req.user.userId;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Необходимо указать позиции заказа' });
    }

    await client.query('BEGIN');

    // Проверяем существование всех товаров
    for (const item of items) {
      const itemCheck = await client.query(
        'SELECT * FROM menuitems_table WHERE item_id = $1',
        [item.item_id]
      );
      
      if (itemCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Товар с ID ${item.item_id} не найден` });
      }
    }

    // Рассчитываем общую стоимость
    const totalPrice = items.reduce(
      (sum, item) => sum + (parseFloat(item.price) * item.quantity),
      0
    );

    // Общее количество товаров
    const totalQuantity = items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // Создаем запись заказа
    const orderResult = await client.query(
      `INSERT INTO orders_table 
       (user_id, total_price, item_quantity)
       VALUES ($1, $2, $3)
       RETURNING order_id`,
      [userId, totalPrice, totalQuantity]
    );
    
    const orderId = orderResult.rows[0].order_id;

    // Добавляем товары в заказ
    for (const item of items) {
      await client.query(
        `INSERT INTO orderitems_table
         (order_id, item_id, quantity, pos_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.item_id, item.quantity, parseFloat(item.price)]
      );

      // Обновляем статистику покупок
      await client.query(
        `UPDATE menuitems_table 
         SET 
           daily_buy = daily_buy + $2,
           monthly_buy = monthly_buy + $2,
           yearly_buy = yearly_buy + $2,
           total_buy = total_buy + $2
         WHERE item_id = $1`,
        [item.item_id, item.quantity]
      );
    }

    await client.query('COMMIT');
    
    res.status(201).json({ 
      message: 'Заказ создан успешно',
      order_id: orderId
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании заказа' });
  } finally {
    client.release();
  }
});

module.exports = router;