const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function deleteCourses() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const courseIds = ['java-masterclass', 'python-bootcamp'];

        console.log('Deleting progress...');
        await pool.query(
            `DELETE FROM progress WHERE lesson_id IN (
                SELECT id FROM lessons WHERE unit_id IN (
                    SELECT id FROM units WHERE course_id IN (?)
                )
            )`,
            [courseIds]
        );

        console.log('Deleting lessons...');
        await pool.query(
            `DELETE FROM lessons WHERE unit_id IN (
                SELECT id FROM units WHERE course_id IN (?)
            )`,
            [courseIds]
        );

        console.log('Deleting units...');
        await pool.query('DELETE FROM units WHERE course_id IN (?)', [courseIds]);

        console.log('Deleting enrollments...');
        await pool.query('DELETE FROM enrollments WHERE course_id IN (?)', [courseIds]);

        console.log('Deleting courses...');
        await pool.query('DELETE FROM courses WHERE id IN (?)', [courseIds]);

        console.log('Successfully deleted the default courses from the database.');
    } catch (err) {
        console.error('Error deleting courses:', err);
    } finally {
        await pool.end();
    }
}

deleteCourses();
