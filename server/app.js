const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// Импорт маршрутов
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const reservationRoutes = require('./routes/reservations');
const tableRoutes = require('./routes/tables');
const categoryRoutes = require('./routes/categories')
const adminUserRoutes = require('./routes/admin/users')
const adminCategoryRoutes = require('./routes/admin/categories');
const adminMenuItemRoutes = require('./routes/admin/menuitems');
const adminPositionRoutes = require('./routes/admin/positions');
const adminEmployeeRoutes = require('./routes/admin/employees');
const adminOrderRoutes = require('./routes/admin/orders');
const adminReservationRoutes = require('./routes/admin/reservations');
const adminTableRoutes = require('./routes/admin/tables');

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Общие заголовки CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Подключение маршрутов
app.use('/api', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/menuitems', adminMenuItemRoutes);
app.use('/api/admin/positions', adminPositionRoutes);
app.use('/api/admin/employees', adminEmployeeRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/reservations', adminReservationRoutes);
app.use('/api/admin/tables', adminTableRoutes);


// Инициализация cron jobs
require('./services/cronJobs');

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: `Internal Server Error: ${err.message}` });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});