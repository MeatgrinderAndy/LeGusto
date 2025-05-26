const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { authenticate, authorizeAdmin } = require('../../utils/authMiddleware');

// Создать элемент меню
router.post('/', authenticate, authorizeAdmin, upload.single('image'), async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      category_id,
      daily_buy = 0,
      monthly_buy = 0,
      yearly_buy = 0,
      total_buy = 0
    } = req.body;
    
    const imageBuffer = req.file ? req.file.buffer : null;

    if (!name || !price || !category_id) {
      return res.status(400).json({ error: 'Name, price and category are required' });
    }

    const query = `
      INSERT INTO menuitems_table 
      (name, description, price, category_id, daily_buy, monthly_buy, yearly_buy, total_buy, image) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `;
    
    const values = [
      name, 
      description, 
      price, 
      category_id,
      daily_buy,
      monthly_buy,
      yearly_buy,
      total_buy,
      imageBuffer
    ];
    
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить все элементы меню
router.get('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const query = 'SELECT * FROM menuitems_table';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить элемент меню по ID
router.get('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'SELECT * FROM menuitems_table WHERE item_id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновить элемент меню
router.put('/:id', authenticate, authorizeAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      price, 
      category_id,
      daily_buy,
      monthly_buy,
      yearly_buy,
      total_buy
    } = req.body;
    
    const imageBuffer = req.file ? req.file.buffer : null;

    // Если есть новое изображение - обновляем его
    if (imageBuffer) {
      const queryWithImage = `
        UPDATE menuitems_table 
        SET 
          name = $1, 
          description = $2, 
          price = $3, 
          category_id = $4,
          daily_buy = $5,
          monthly_buy = $6,
          yearly_buy = $7,
          total_buy = $8,
          image = $9
        WHERE item_id = $10 
        RETURNING *
      `;
      
      const values = [
        name, 
        description, 
        price, 
        category_id,
        daily_buy,
        monthly_buy,
        yearly_buy,
        total_buy,
        imageBuffer,
        id
      ];
      
      const result = await pool.query(queryWithImage, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Menu item not found' });
      }
      
      return res.status(200).json(result.rows[0]);
    } 
    // Если изображения нет - обновляем только данные
    else {
      const queryWithoutImage = `
        UPDATE menuitems_table 
        SET 
          name = $1, 
          description = $2, 
          price = $3, 
          category_id = $4,
          daily_buy = $5,
          monthly_buy = $6,
          yearly_buy = $7,
          total_buy = $8
        WHERE item_id = $9 
        RETURNING *
      `;
      
      const values = [
        name, 
        description, 
        price, 
        category_id,
        daily_buy,
        monthly_buy,
        yearly_buy,
        total_buy,
        id
      ];
      
      const result = await pool.query(queryWithoutImage, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Menu item not found' });
      }
      
      return res.status(200).json(result.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Удалить элемент меню
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем существование элемента
    const checkQuery = 'SELECT * FROM menuitems_table WHERE item_id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Получаем order_ids связанных заказов
    const ordersQuery = `
      SELECT DISTINCT o.order_id
      FROM orders_table o
      JOIN orderitems_table oi ON o.order_id = oi.order_id
      WHERE oi.item_id = $1 AND o.status IN ('completed', 'declined')
    `;
    const ordersResult = await pool.query(ordersQuery, [id]);

    // Удаляем заказы если они есть
    if (ordersResult.rows.length > 0) {
      const orderIds = ordersResult.rows.map(order => order.order_id);
      await pool.query('DELETE FROM orders_table WHERE order_id = ANY($1::int[])', [orderIds]);
    }

    // Удаляем сам элемент меню
    const deleteQuery = 'DELETE FROM menuitems_table WHERE item_id = $1 RETURNING *';
    const deleteResult = await pool.query(deleteQuery, [id]);

    res.status(200).json({ 
      success: true,
      message: 'Menu item and related orders deleted successfully',
      deletedItem: deleteResult.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: err.message 
    });
  }
});

// Получить элементы меню по категории
router.get('/category/:category_id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { category_id } = req.params;
    const query = 'SELECT * FROM menuitems_table WHERE category_id = $1';
    const result = await pool.query(query, [category_id]);
    
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;