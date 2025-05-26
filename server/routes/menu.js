const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Полное меню с категориями и элементами
router.get('/', async (req, res) => {
  try {
    const [categoriesResult, itemsResult] = await Promise.all([
      pool.query('SELECT * FROM category_table ORDER BY category_id'),
      pool.query('SELECT * FROM menuitems_table')
    ]);

    const categories = categoriesResult.rows;
    const items = itemsResult.rows;

    const menuData = categories.map(category => ({
      id: category.category_id,
      name: category.category_name,
      description: category.category_description,
      image: category.image ? {
        data: category.image.toString('base64'),
        contentType: 'image/jpeg'
      } : null,
      items: items
        .filter(item => item.category_id === category.category_id)
        .map(item => ({
          id: item.item_id,
          name: item.name,
          description: item.description,
          price: parseFloat(item.price),
          image: item.image ? {
            data: item.image.toString('base64'),
            contentType: 'image/jpeg'
          } : null
        }))
    }));

    res.json(menuData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении меню' });
  }
});

// Меню для заказа (упрощенное)
router.get('/order', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.item_id,
        m.name,
        m.description,
        m.price,
        m.category_id,
        c.category_name
      FROM menuitems_table m
      JOIN category_table c ON m.category_id = c.category_id
      ORDER BY c.category_name, m.name
    `);
    
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении меню' });
  }
});

module.exports = router;