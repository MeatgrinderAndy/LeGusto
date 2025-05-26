const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../utils/authMiddleware');


router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM category_table order by category_id';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
