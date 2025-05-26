const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const { authenticate, authorizeAdmin } = require('../../utils/authMiddleware');

// Получить всех сотрудников с информацией о должностях
router.get('/', authenticate, authorizeAdmin, async (req, res) => {
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

// Получить сотрудника по ID
router.get('/:id', authenticate, authorizeAdmin, async (req, res) => {
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

// Создать нового сотрудника
router.post('/', authenticate, authorizeAdmin, async (req, res) => {
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

// Обновить данные сотрудника
router.put('/:id', authenticate, authorizeAdmin, async (req, res) => {
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

// Удалить сотрудника
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
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

module.exports = router;