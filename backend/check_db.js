const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function checkUsers() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const [rows] = await pool.query('SELECT id, name, email FROM users');
        console.log('Users in DB:', rows);
        await pool.end();
    } catch (err) {
        console.error('DB Error:', err);
    }
}

checkUsers();
