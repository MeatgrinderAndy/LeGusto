const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const { authenticate, authorizeAdmin } = require('../../utils/authMiddleware');

// Получить все должности
router.get('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const query = 'SELECT * FROM positions_table ORDER BY position_name';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить должность по ID
router.get('/:id', authenticate, authorizeAdmin, async (req, res) => {
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

// Создать новую должность
router.post('/', authenticate, authorizeAdmin, async (req, res) => {
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

// Обновить должность
router.put('/:id', authenticate, authorizeAdmin, async (req, res) => {
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

// Удалить должность
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
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

module.exports = router;