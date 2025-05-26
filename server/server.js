const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const saltRounds = 10;
const jwtSecret = 'sUp3r-s3cre7-key-n0body-t0-know-cause-its-secret'; 

const pool = new Pool({
    user: 'gusto_admin',
    host: 'localhost',
    database: 'gusto_database',
    password: '12345',
    port: 5432,
});

cron.schedule('0 0 * * *', async () => {
  await pool.query('SELECT clear_daily_buy()');
});

cron.schedule('0 0 1 * *', async () => {
  await pool.query('SELECT clear_monthly_buy()');
});

cron.schedule('0 0 1 1 *', async () => {
  await pool.query('SELECT clear_yearly_buy()');
});

cron.schedule('0 5 * * *', async () => {
  await pool.query('SELECT clear_orders()');
});

cron.schedule('0 5 * * *', async () => {
  await pool.query('SELECT clear_old_reservations()');
});

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: "legustoteam@gmail.com",
    pass: "veyx cfjl hzzi aujr"
  }
});

cron.schedule('* * * * *', async () => {
  try {
    const query = `
      SELECT r.*, u.email, u.first_name 
      FROM reservations_table r
      JOIN users_table u ON r.user_id = u.user_id
      WHERE DATE(r.reservation_date) <= CURRENT_DATE + INTERVAL '1 day'
      AND r.reservation_status = 'confirmed'
      AND r.reminder_sent = false
      AND u.email IS NOT NULL
      AND u.email <> ''
    `;
    
    const result = await pool.query(query);
    const reservations = result.rows;
    let sentCount = 0;
    let skippedCount = 0;

    for (const reservation of reservations) {
      if (!reservation.email || reservation.email.trim() === '') {
        console.log(`Пропущено бронирование ${reservation.reservation_id} - email не указан`);
        skippedCount++;
        continue;
      }

      try {
        const reservationDate = new Date(reservation.reservation_date);
        const formattedDate = reservationDate.toLocaleDateString('ru-RU');
        const formattedTime = reservationDate.toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        await transporter.sendMail({
          from: '"Le Gusto" <no-reply@legusto.com>',
          to: reservation.email,
          subject: 'Напоминание о бронировании',
          html: `
            <h2>Уважаемый(ая) ${reservation.first_name},</h2>
            <p>Напоминаем, что завтра, ${formattedDate}, 
            у вас забронирован столик в нашем ресторане на ${formattedTime}.</p>
            <p>Количество гостей: ${reservation.guests_number}</p>
            <p>Номер бронирования: ${reservation.reservation_id}</p>
            <p>С уважением, команда Le Gusto</p>
          `
        });

        await pool.query(
          'UPDATE reservations_table SET reminder_sent = true WHERE reservation_id = $1',
          [reservation.reservation_id]
        );
        sentCount++;
      } catch (emailError) {
        console.error(`Ошибка при отправке письма для бронирования ${reservation.reservation_id}:`, emailError);
      }
    }
    
    console.log(`Отправлено ${sentCount} напоминаний, пропущено ${skippedCount} (email не указан)`);
  } catch (error) {
    console.error('Ошибка при отправке напоминаний:', error);
  }
});

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Чтение всех пользователей (Read All)
app.get('/api/admin/users', async (req, res) => {
  try {
    const query = 'SELECT * FROM users_table order by user_id';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//Чтение одного пользователя (Read One)
app.get('/api/admin/users/:id', async (req, res) => {
  try {
    const query = 'SELECT * FROM users_table WHERE user_id = $1';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//Удаление пользователя (Delete)
app.delete('/api/admin/users/:id', async (req, res) => {
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

// Создание категории (Create)
app.post('/api/admin/menuitems', upload.single('image'), async (req, res) => {
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

// Чтение всех категорий (Read All)
app.get('/api/admin/categories', async (req, res) => {
  try {
    const query = 'SELECT * FROM category_table order by category_id';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const query = 'SELECT * FROM category_table order by category_id';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Чтение одной категории по ID (Read One)
app.get('/api/admin/categories/:id', async (req, res) => {
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

// Обновление категории (Update)
app.put('/api/admin/categories/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, category_description } = req.body;
    const imageBuffer = req.file ? req.file.buffer : null;
    console.log(req.file)
    const query = `
      UPDATE category_table 
      SET category_name = $1, category_description = $2, image = $3
      WHERE category_id = $4 
      RETURNING *`;

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


// Удаление категории (Delete)
async function deleteMenuItemById(client, itemId) {
  // Проверяем существование элемента перед удалением
  const checkQuery = 'SELECT * FROM menuitems_table WHERE item_id = $1';
  const checkResult = await client.query(checkQuery, [itemId]);

  if (checkResult.rows.length === 0) {
    throw new Error('Menu item not found');
  }

  // Удаляем связанные записи в orderitems_table
  await client.query('DELETE FROM orderitems_table WHERE item_id = $1', [itemId]);

  // Получаем order_ids, связанные с item_id и статусом completed или declined
  const ordersQuery = `
    SELECT DISTINCT o.order_id
    FROM orders_table o
    JOIN orderitems_table oi ON o.order_id = oi.order_id
    WHERE oi.item_id = $1 AND o.status IN ('completed', 'declined')
  `;
  const ordersResult = await client.query(ordersQuery, [itemId]);

  // Удаляем заказы, если они найдены
  if (ordersResult.rows.length > 0) {
    const orderIds = ordersResult.rows.map(order => order.order_id);
    await client.query('DELETE FROM orders_table WHERE order_id = ANY($1::int[])', [orderIds]);
  }

  // Удаляем элемент меню
  const deleteQuery = 'DELETE FROM menuitems_table WHERE item_id = $1 RETURNING *';
  const deleteResult = await client.query(deleteQuery, [itemId]);

  return deleteResult.rows[0];
}

app.delete('/api/admin/categories/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;

    // Получаем все menuitem, связанные с категорией
    const menuItemsQuery = 'SELECT item_id FROM menuitems_table WHERE category_id = $1';
    const menuItemsResult = await client.query(menuItemsQuery, [id]);

    // Удаляем каждый элемент меню
    for (const menuItem of menuItemsResult.rows) {
      await deleteMenuItemById(client, menuItem.item_id);
    }

    // Удаляем категорию
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

app.delete('/api/admin/categories/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;

    const menuItemsQuery = 'SELECT item_id FROM menuitems_table WHERE category_id = $1';
    const menuItemsResult = await client.query(menuItemsQuery, [id]);

    for (const menuItem of menuItemsResult.rows) {
      await deleteMenuItemById(client, menuItem.item_id);
    }

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

// CRUD операции для меню

// Создание элемента меню (Create)
app.post('/api/admin/menuitems', async (req, res) => {
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
    
    if (!name || !price || !category_id) {
      return res.status(400).json({ error: 'Name, price and category are required' });
    }

    const query = `
      INSERT INTO menuitems_table 
      (name, description, price, category_id, daily_buy, monthly_buy, yearly_buy, total_buy) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
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
      total_buy
    ];
    
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Чтение всех элементов меню (Read All)
app.get('/api/admin/menuitems', async (req, res) => {
  try {
    const query = 'SELECT * FROM menuitems_table';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Чтение одного элемента меню по ID (Read One)
app.get('/api/admin/menuitems/:id', async (req, res) => {
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

// Обновление элемента меню (Update)
app.put('/api/admin/menuitems/:id', upload.single('image'), async (req, res) => {
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

    // Если пришло новое изображение - обновляем его
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
    // Если изображение не пришло - обновляем только данные
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

// Удаление элемента меню (Delete)
app.delete('/api/admin/menuitems/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем существование элемента перед удалением
    const checkQuery = 'SELECT * FROM menuitems_table WHERE item_id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Получаем order_ids, связанные с item_id и статусом completed или declined
    const ordersQuery = `
      SELECT DISTINCT o.order_id
      FROM orders_table o
      JOIN orderitems_table oi ON o.order_id = oi.order_id
      WHERE oi.item_id = $1 AND o.status IN ('completed', 'declined')
    `;
    const ordersResult = await pool.query(ordersQuery, [id]);

    // Удаляем заказы, если они найдены
    if (ordersResult.rows.length > 0) {
      const orderIds = ordersResult.rows.map(order => order.order_id);
      await pool.query('DELETE FROM orders_table WHERE order_id = ANY($1::int[])', [orderIds]);
    }

    // Удаляем элемент меню
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

// Получение элементов меню по категории
app.get('/api/admin/menuitems/category/:category_id', async (req, res) => {
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

// GET /api/admin/positions - Получить все должности
app.get('/api/admin/positions', async (req, res) => {
  try {
    const query = 'SELECT * FROM positions_table ORDER BY position_name';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/positions/:id - Получить должность по ID
app.get('/api/admin/positions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'SELECT * FROM positions_table WHERE position_id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Position not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/positions - Создать новую должность
app.post('/api/admin/positions', async (req, res) => {
  try {
    const { position_name } = req.body;
    
    if (!position_name) {
      return res.status(400).json({ error: 'Position name is required' });
    }

    const query = `
      INSERT INTO positions_table (position_name)
      VALUES ($1)
      RETURNING *
    `;
    
    const result = await pool.query(query, [position_name]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/positions/:id - Обновить должность
app.put('/api/admin/positions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { position_name } = req.body;
    
    if (!position_name) {
      return res.status(400).json({ error: 'Position name is required' });
    }

    const query = `
      UPDATE positions_table
      SET position_name = $1
      WHERE position_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [position_name, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Position not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/positions/:id - Удалить должность
app.delete('/api/admin/positions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, используется ли должность сотрудниками
    const checkQuery = 'SELECT * FROM employees_table WHERE position_id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete position - it is assigned to employees' 
      });
    }

    const deleteQuery = `
      DELETE FROM positions_table
      WHERE position_id = $1
      RETURNING *
    `;
    
    const result = await pool.query(deleteQuery, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Position not found' });
    }
    
    res.status(200).json({ 
      message: 'Position deleted successfully',
      deletedPosition: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/employees - Получить всех сотрудников с информацией о должностях
app.get('/api/admin/employees', async (req, res) => {
  try {
    const query = `
      SELECT 
        e.employee_id,
        e.first_name,
        e.last_name,
        e.salary,
        e.position_id,
        p.position_name
      FROM employees_table e
      LEFT JOIN positions_table p ON e.position_id = p.position_id
      ORDER BY e.last_name, e.first_name
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/employees/:id - Получить сотрудника по ID
app.get('/api/admin/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        e.employee_id,
        e.first_name,
        e.last_name,
        e.salary,
        e.position_id,
        p.position_name
      FROM employees_table e
      LEFT JOIN positions_table p ON e.position_id = p.position_id
      WHERE e.employee_id = $1
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/employees - Создать нового сотрудника
app.post('/api/admin/employees', async (req, res) => {
  try {
    const { first_name, last_name, position_id, salary } = req.body;
    
    if (!first_name || !last_name || !position_id || salary === undefined) {
      return res.status(400).json({ 
        error: 'First name, last name, position ID and salary are required' 
      });
    }

    // Проверяем существование должности
    const positionCheck = await pool.query(
      'SELECT * FROM positions_table WHERE position_id = $1',
      [position_id]
    );
    
    if (positionCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid position ID' });
    }

    const query = `
      INSERT INTO employees_table 
        (first_name, last_name, position_id, salary)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      first_name, 
      last_name, 
      position_id, 
      salary
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/employees/:id - Обновить данные сотрудника
app.put('/api/admin/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, position_id, salary } = req.body;
    
    if (!first_name || !last_name || !position_id || salary === undefined) {
      return res.status(400).json({ 
        error: 'First name, last name, position ID and salary are required' 
      });
    }

    // Проверяем существование должности
    const positionCheck = await pool.query(
      'SELECT * FROM positions_table WHERE position_id = $1',
      [position_id]
    );
    
    if (positionCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid position ID' });
    }

    const query = `
      UPDATE employees_table
      SET 
        first_name = $1,
        last_name = $2,
        position_id = $3,
        salary = $4
      WHERE employee_id = $5
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      first_name, 
      last_name, 
      position_id, 
      salary,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/employees/:id - Удалить сотрудника
app.delete('/api/admin/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      DELETE FROM employees_table
      WHERE employee_id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.status(200).json({ 
      message: 'Employee deleted successfully',
      deletedEmployee: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/orders - Получить все заказы с информацией о пользователях
app.get('/api/admin/orders', async (req, res) => {
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

// GET /api/admin/orders/:id - Получить заказ по ID с деталями
app.get('/api/admin/orders/:id', async (req, res) => {
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

// POST /api/admin/orders - Создать новый заказ
app.post('/api/admin/orders', async (req, res) => {
  try {
    const { user_id, items } = req.body;
    
    if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'User ID and items are required' });
    }

    // Проверяем существование пользователя
    const userCheck = await pool.query(
      'SELECT * FROM users_table WHERE user_id = $1',
      [user_id]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Проверяем существование всех товаров
    for (const item of items) {
      const itemCheck = await pool.query(
        'SELECT * FROM menuitems_table WHERE item_id = $1',
        [item.item_id]
      );
      
      if (itemCheck.rows.length === 0) {
        return res.status(400).json({ error: `Item ${item.item_id} not found` });
      }
    }

    // Рассчитываем общую стоимость
    const totalPrice = items.reduce((sum, item) => {
      return sum + (item.pos_price * item.quantity);
    }, 0);

    // Общее количество товаров
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    // Создаем заказ в транзакции
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Создаем запись заказа
      const orderQuery = `
        INSERT INTO orders_table 
          (user_id, total_price, item_quantity)
        VALUES ($1, $2, $3)
        RETURNING order_id
      `;
      
      const orderResult = await client.query(orderQuery, [
        user_id, 
        totalPrice, 
        totalQuantity
      ]);
      
      const orderId = orderResult.rows[0].order_id;
      
      // Добавляем товары в заказ
      for (const item of items) {
        const itemQuery = `
          INSERT INTO orderitems_table
            (order_id, item_id, quantity, pos_price)
          VALUES ($1, $2, $3, $4)
        `;
        
        await client.query(itemQuery, [
          orderId,
          item.item_id,
          item.quantity,
          item.pos_price
        ]);
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({ 
        message: 'Order created successfully',
        order_id: orderId
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

// PUT /api/admin/orders/:id - Обновить статус заказа
app.put('/api/admin/orders/:id', async (req, res) => {
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

// DELETE /api/admin/orders/:id - Удалить заказ
app.delete('/api/admin/orders/:id', async (req, res) => {
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

// GET /api/admin/orderitems/:order_id - Получить все элементы заказа
app.get('/api/admin/orderitems/:order_id', async (req, res) => {
  try {
    const { order_id } = req.params;
    
    const query = `
      SELECT 
        oi.*,
        m.name as item_name,
        m.price as current_price
      FROM orderitems_table oi
      LEFT JOIN menuitems_table m ON oi.item_id = m.item_id
      WHERE oi.order_id = $1
    `;
    
    const result = await pool.query(query, [order_id]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/orderitems - Добавить элемент в заказ
app.post('/api/admin/orderitems', async (req, res) => {
  try {
    const { order_id, item_id, quantity } = req.body;
    
    if (!order_id || !item_id || !quantity) {
      return res.status(400).json({ 
        error: 'Order ID, item ID and quantity are required' 
      });
    }

    // Проверяем существование заказа
    const orderCheck = await pool.query(
      'SELECT * FROM orders_table WHERE order_id = $1',
      [order_id]
    );
    
    if (orderCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Order not found' });
    }

    // Проверяем существование товара
    const itemCheck = await pool.query(
      'SELECT * FROM menuitems_table WHERE item_id = $1',
      [item_id]
    );
    
    if (itemCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Item not found' });
    }

    // Получаем текущую цену товара
    const currentPrice = itemCheck.rows[0].price;

    const query = `
      INSERT INTO orderitems_table
        (order_id, item_id, quantity, pos_price)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      order_id,
      item_id,
      quantity,
      currentPrice
    ]);
    
    // Обновляем общую стоимость заказа
    await updateOrderTotal(order_id);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/orderitems/:id - Обновить элемент заказа
app.put('/api/admin/orderitems/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (!quantity) {
      return res.status(400).json({ error: 'Quantity is required' });
    }

    // Получаем текущий элемент заказа
    const currentItem = await pool.query(
      'SELECT * FROM orderitems_table WHERE order_item_id = $1',
      [id]
    );
    
    if (currentItem.rows.length === 0) {
      return res.status(404).json({ error: 'Order item not found' });
    }

    const order_id = currentItem.rows[0].order_id;

    const query = `
      UPDATE orderitems_table
      SET quantity = $1
      WHERE order_item_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [quantity, id]);
    
    // Обновляем общую стоимость заказа
    await updateOrderTotal(order_id);
    
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/orderitems/:id - Удалить элемент из заказа
app.delete('/api/admin/orderitems/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Получаем текущий элемент заказа
    const currentItem = await pool.query(
      'SELECT * FROM orderitems_table WHERE order_item_id = $1',
      [id]
    );
    
    if (currentItem.rows.length === 0) {
      return res.status(404).json({ error: 'Order item not found' });
    }

    const order_id = currentItem.rows[0].order_id;

    const result = await pool.query(
      'DELETE FROM orderitems_table WHERE order_item_id = $1 RETURNING *',
      [id]
    );
    
    // Обновляем общую стоимость заказа
    await updateOrderTotal(order_id);
    
    res.status(200).json({ 
      message: 'Order item deleted successfully',
      deletedItem: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Вспомогательная функция для обновления общей стоимости заказа
async function updateOrderTotal(order_id) {
  // Получаем сумму всех элементов заказа
  const sumQuery = `
    SELECT SUM(pos_price * quantity) as total, SUM(quantity) as quantity
    FROM orderitems_table
    WHERE order_id = $1
  `;
  const sumResult = await pool.query(sumQuery, [order_id]);
  
  const total = sumResult.rows[0].total || 0;
  const quantity = sumResult.rows[0].quantity || 0;
  
  // Обновляем заказ
  await pool.query(
    'UPDATE orders_table SET total_price = $1, item_quantity = $2 WHERE order_id = $3',
    [total, quantity, order_id]
  );
}

// POST /api/orders - Создание нового заказа
app.post('/api/orders', async (req, res) => {
  try {
    // Получаем токен из заголовка Authorization
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    // Проверяем токен и получаем user_id
    const decoded = jwt.verify(token, jwtSecret);
    const user_id = decoded.userId;

    // Остальная логика обработки заказа...
    const { items } = req.body;
    console.log(items);
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    // Проверяем существование всех товаров
    for (const item of items) {
      const itemCheck = await pool.query(
        'SELECT * FROM menuitems_table WHERE item_id = $1',
        [item.item_id]
      )
      
      if (itemCheck.rows.length === 0) {
        return res.status(400).json({ error: `Item ${item.item_id} not found` })
      }
    }

    // Рассчитываем общую стоимость
    const totalPrice = items.reduce(
      (sum, item) => sum + (parseFloat(item.price) * item.quantity),
      0
    )

    // Общее количество товаров
    const totalQuantity = items.reduce(
      (sum, item) => sum + item.quantity,
      0
    )

    // Создаем заказ в транзакции
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      
      // Создаем запись заказа
      const orderQuery = `
        INSERT INTO orders_table 
          (user_id, total_price, item_quantity)
        VALUES ($1, $2, $3)
        RETURNING order_id
      `
      
      const orderResult = await client.query(orderQuery, [
        user_id,
        totalPrice,
        totalQuantity
      ])
      
      const order_id = orderResult.rows[0].order_id
      
      // Добавляем товары в заказ
      for (const item of items) {
        const itemQuery = `
          INSERT INTO orderitems_table
            (order_id, item_id, quantity, pos_price)
          VALUES ($1, $2, $3, $4)
        `
        const statsQuery = `
          UPDATE menuitems_table 
          SET 
          daily_buy = daily_buy + 1 * $2,
          monthly_buy = monthly_buy + 1 * $2,
          yearly_buy = yearly_buy + 1 * $2,
          total_buy = total_buy + 1 * $2
          WHERE item_id = $1; 
        `
        console.log(parseFloat(item.price))
        console.log(item.quantity)
        console.log(parseFloat(item.price) * item.quantity)
        console.log(item)
        await client.query(itemQuery, [
          order_id,
          item.item_id,
          item.quantity,
          parseFloat(item.price) * item.quantity
        ])

        await client.query(statsQuery, [item.item_id, item.quantity]);
      }
      
      await client.query('COMMIT')
      
      res.status(201).json({ 
        message: 'Order created successfully',
        order_id
      })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/user/:id/orders', async (req, res) => {
  let client;
  try {
    const userId = parseInt(req.params.id);
    const token = req.headers.authorization?.split(' ')[1];

    // Проверка авторизации
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Верификация токена
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, jwtSecret);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    console.log(req.params.id)
    console.log(decodedToken)

    // Проверка прав доступа
    if (decodedToken.userId !== userId && !decodedToken.is_admin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    client = await pool.connect();

    // Запрос для получения заказов с их позициями
    const ordersQuery = `
      SELECT 
        o.order_id,
        o.order_date,
        o.total_price,
        o.item_quantity,
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

    const { rows: orders } = await client.query(ordersQuery, [userId]);

    // Форматирование ответа
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
        image_url: item.image_url
      }))
    }));

    res.json(formattedOrders);

  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Server error while fetching orders' });
  } finally {
    if (client) client.release();
  }
});

app.get('/api/menu/order', async (req, res) => {
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение всех столов
app.get('/api/tables', async (req, res) => {
  try {
    const query = "SELECT * FROM tables_table WHERE status = 'Available'";
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/tables', async (req, res) => {
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

// GET single table by ID
app.get('/api/admin/tables/:id', async (req, res) => {
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

// POST create new table
app.post('/api/admin/tables', async (req, res) => {
  try {
    const { capacity, waiter } = req.body;
    
    // Validate input
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

// PUT update table
app.put('/api/admin/tables/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { capacity, waiter } = req.body;
    
    // Validate input
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

// DELETE table
app.delete('/api/admin/tables', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if the table exists
    const checkResult = await pool.query(
      'SELECT * FROM tables_table WHERE table_id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    // Delete the table
    await db.query(
      'DELETE FROM tables_table WHERE table_id = $1',
      [id]
    );
    
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

// GET all waiters
app.get('/api/admin/waiters', async (req, res) => {
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

app.get('/api/admin/reservations', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, t.capacity
      FROM reservations_table r
      JOIN tables_table t ON r.table_id = t.table_id
      ORDER BY r.reservation_date DESC
    `)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch reservations' })
  }
})

app.put('/api/admin/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }
    
    const result = await pool.query(
      'UPDATE reservations_table SET reservation_status = $1 WHERE reservation_id = $2 RETURNING *',
      [status, id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }
    
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update reservation status' })
  }
})

// Пример реализации на сервере
app.get('/api/reservations/user/:user_id', async (req, res) => {
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

// PUT /api/reservations/:id/cancel
app.put('/api/reservations/:id/cancel', async (req, res) => {
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

// Создание бронирования с продолжительностью
app.post('/api/reservations', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const decoded = jwt.verify(token, jwtSecret);
    const user_id = decoded.userId;

    const { table_id, reservation_date, duration, guests } = req.body;
    
    if (!table_id || !reservation_date || !duration || !guests) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const durationHours = parseInt(duration);
    const startDate = new Date(reservation_date);
    const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

    // Проверка доступности стола
    const availabilityCheck = await pool.query(
      `SELECT * FROM reservations_table 
       WHERE table_id = $1 
       AND (reservation_status != 'cancelled' OR reservation_status != 'expired')
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
      user_id,
      table_id,
      startDate,
      durationHours,
      guests
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение меню
app.get('/api/menu', async (req, res) => {
  try {
    const [categoriesResult, itemsResult] = await Promise.all([
      pool.query('SELECT * FROM category_table order by category_id'),
      pool.query('SELECT * FROM menuitems_table')
    ]);

    const categories = categoriesResult.rows;
    const items = itemsResult.rows;

    const menuData = categories.map(category => ({
      id: category.category_id,
      name: category.category_name,
      category_description: category.category_description,
      image_data: category.image ? Array.from(category.image) : null,
      image_type: 'image/jpg', // или определяй динамически, если у тебя есть тип
      items: items
        .filter(item => item.category_id === category.category_id)
        .map(item => ({
          ...item,
          image_data: item.image ? Array.from(item.image) : null,
          image_type: 'image/jpg' // или другой тип
        }))
    }));

    res.json(menuData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
  const { name, surname, phone, password } = req.body;
  console.log(name, surname, phone, password);
  if (!name || !surname || !phone || !password) {
    return res.status(400).json({ error: 'Info missing' });
  }

  try {
    const userExists = await pool.query('SELECT * FROM Users_Table WHERE phone = $1', [phone]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User with this phone already exists', message: 'Номер телефона уже зарегистрирован' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await pool.query(
      'INSERT INTO Users_Table (first_name, last_name, phone, password) VALUES ($1, $2, $3, $4)',
      [name, surname, phone, hashedPassword]
    );

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error during registration' });
  }
});

async function getAvailableTables(req, res) {
    try {
      console.log(req.query)
        const { date, time, duration = 2 } = req.query; // По умолчанию 2 часа
        
        if (!date || !time) {
            return res.status(400).json({ error: 'Необходимо указать дату и время' });
        }

        // Проверяем валидность даты и времени
        const reservationDateTime = new Date(`${date}T${time}`);
        console.log(reservationDateTime)
        if (isNaN(reservationDateTime.getTime())) {
            return res.status(400).json({ error: 'Некорректная дата или время' });
        }

        // Проверяем валидность длительности
        const durationHours = parseFloat(duration);
        if (isNaN(durationHours)) {
            return res.status(400).json({ error: 'Некорректная длительность бронирования' });
        }

        // Вычисляем время окончания брони
        const endDateTime = new Date(reservationDateTime.getTime() + durationHours * 60 * 60 * 1000);

        // Запрос для получения доступных столов
        const query = `
            SELECT t.*
            FROM tables_table t
            WHERE t.table_id NOT IN (
                SELECT r.table_id
                FROM reservations_table r
                WHERE 
                    (r.reservation_date <= $2 AND 
                     r.reservation_date + (r.duration * INTERVAL '1 hour') >= $1)
                    AND r.reservation_status != 'cancelled'
            )
            ORDER BY t.capacity;
        `;

        const result = await pool.query(query, [reservationDateTime, endDateTime]);

        res.json({
            available_tables: result.rows,
            date: date,
            time: time,
            duration: durationHours,
            total_available: result.rowCount
        });
        console.log(result.rows)
    } catch (error) {
        console.error('Ошибка при проверке доступных столов:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера при проверке доступных столов',
            details: error.message
        });
    }
}

app.get('/api/tables/available', async (req, res) => {
    try {
        await getAvailableTables(req, res); // Просто проксируем req и res
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({ error: error.message });
    }
});

// Получение данных пользователя по ID
app.get('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'SELECT * FROM users_table WHERE user_id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = result.rows[0];
    // Преобразование типов
    const response = {
      ...userData,
      order_amount: Number(userData.order_amount),
      orders_price: Number(userData.orders_price)
    };
    
    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновление данных пользователя
app.put('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone } = req.body;
    const { email } = req.body;
  
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Некорректный email' });
    }

    const query = `
      UPDATE users_table 
      SET first_name = $1, last_name = $2, phone = $3, email = $4
      WHERE user_id = $5
      RETURNING user_id, first_name, last_name, phone, email, order_amount, orders_price, vip, is_admin`;

    const values = [first_name, last_name, phone, email, id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Вход пользователя
app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone and password are required' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM Users_Table WHERE phone = $1', [phone]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid phone or password' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid phone or password' });
    }

    // Создаём JWT токен
    const token = jwt.sign(
      { userId: user.user_id, phone: user.phone, is_admin: user.is_admin },
      jwtSecret,
      { expiresIn: '7d' } // токен живёт 7 дней
    );

    // Возвращаем данные пользователя и токен
    res.status(200).json({ 
      message: 'Login successful', 
      token,
      user: {
        id: user.user_id,
        phone: user.phone,
        is_admin: user.is_admin,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error during login' });
  }
});



// Запуск сервера
app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});
