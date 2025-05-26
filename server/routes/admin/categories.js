const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { authenticate, authorizeAdmin } = require('../../utils/authMiddleware');

// Получить все категории
router.get('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const query = 'SELECT * FROM category_table ORDER BY category_id';
    const result = await pool.query(query);
    console.log(result)
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить категорию по ID
router.get('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'SELECT * FROM category_table WHERE category_id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Создать новую категорию
router.post('/', authenticate, authorizeAdmin, upload.single('image'), async (req, res) => {
  try {
    const { category_name, category_description } = req.body;
    const imageBuffer = req.file ? req.file.buffer : null;

    if (!category_name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const query = `
      INSERT INTO category_table 
      (category_name, category_description, image) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `;
    
    const result = await pool.query(query, [category_name, category_description, imageBuffer]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновить категорию
router.put('/:id', authenticate, authorizeAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, category_description } = req.body;
    const imageBuffer = req.file ? req.file.buffer : null;

    const query = `
      UPDATE category_table 
      SET category_name = $1, category_description = $2, image = $3
      WHERE category_id = $4 
      RETURNING *
    `;

    const values = [category_name, category_description, imageBuffer, id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Удалить категорию
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;

    // Получаем все элементы меню в этой категории
    const menuItemsQuery = 'SELECT item_id FROM menuitems_table WHERE category_id = $1';
    const menuItemsResult = await client.query(menuItemsQuery, [id]);

    // Удаляем каждый элемент меню
    for (const menuItem of menuItemsResult.rows) {
      await deleteMenuItemById(client, menuItem.item_id);
    }

    // Удаляем саму категорию
    const query = 'DELETE FROM category_table WHERE category_id = $1 RETURNING *';
    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Category not found' });
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Category and related menu items deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  } finally {
    client.release();
  }
});

// Вспомогательная функция для удаления элемента меню
async function deleteMenuItemById(client, itemId) {
  // Проверяем существование элемента
  const checkQuery = 'SELECT * FROM menuitems_table WHERE item_id = $1';
  const checkResult = await client.query(checkQuery, [itemId]);

  if (checkResult.rows.length === 0) {
    throw new Error('Menu item not found');
  }

  // Удаляем связанные записи
  await client.query('DELETE FROM orderitems_table WHERE item_id = $1', [itemId]);

  // Получаем order_ids связанных с item_id
  const ordersQuery = `
    SELECT DISTINCT o.order_id
    FROM orders_table o
    JOIN orderitems_table oi ON o.order_id = oi.order_id
    WHERE oi.item_id = $1 AND o.status IN ('completed', 'declined')
  `;
  const ordersResult = await client.query(ordersQuery, [itemId]);

  // Удаляем заказы если они есть
  if (ordersResult.rows.length > 0) {
    const orderIds = ordersResult.rows.map(order => order.order_id);
    await client.query('DELETE FROM orders_table WHERE order_id = ANY($1::int[])', [orderIds]);
  }

  // Удаляем сам элемент меню
  const deleteQuery = 'DELETE FROM menuitems_table WHERE item_id = $1 RETURNING *';
  const deleteResult = await client.query(deleteQuery, [itemId]);

  return deleteResult.rows[0];
}

module.exports = router;