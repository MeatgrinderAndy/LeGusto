const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { jwtSecret, saltRounds } = require('../config/constants');

// Регистрация пользователя
router.post('/register', async (req, res) => {
  const { name, surname, phone, password } = req.body;
  
  if (!name || !surname || !phone || !password) {
    return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
  }

  try {
    // Проверяем существование пользователя
    const userExists = await pool.query(
      'SELECT * FROM users_table WHERE phone = $1', 
      [phone]
    );
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Пользователь с таким телефоном уже существует'
      });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Создаем пользователя
    const newUser = await pool.query(
      'INSERT INTO users_table (first_name, last_name, phone, password) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, surname, phone, hashedPassword]
    );

    // Генерируем JWT токен
    const token = jwt.sign(
      { 
        userId: newUser.rows[0].user_id, 
        phone: newUser.rows[0].phone, 
        is_admin: newUser.rows[0].is_admin 
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      message: 'Регистрация прошла успешно',
      token,
      user: {
        id: newUser.rows[0].user_id,
        phone: newUser.rows[0].phone,
        first_name: newUser.rows[0].first_name,
        last_name: newUser.rows[0].last_name,
        is_admin: newUser.rows[0].is_admin
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при регистрации' });
  }
});

// Вход пользователя
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: 'Телефон и пароль обязательны' });
  }

  try {
    // Ищем пользователя
    const userResult = await pool.query(
      'SELECT * FROM users_table WHERE phone = $1', 
      [phone]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный телефон или пароль' });
    }

    const user = userResult.rows[0];
    
    // Проверяем пароль
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Неверный телефон или пароль' });
    }

    // Генерируем JWT токен
    const token = jwt.sign(
      { 
        userId: user.user_id, 
        phone: user.phone, 
        is_admin: user.is_admin 
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Вход выполнен успешно',
      token,
      user: {
        id: user.user_id,
        phone: user.phone,
        first_name: user.first_name,
        last_name: user.last_name,
        is_admin: user.is_admin
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при входе' });
  }
});

module.exports = router;