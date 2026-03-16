const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const courses = [];

async function seed() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    });

    try {
        for (const course of courses) {
            await pool.query(
                'INSERT INTO courses (id, title, instructor, thumbnail, description, category) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title)',
                [course.id, course.title, course.instructor, course.thumbnail, course.description, course.category]
            );

            for (let i = 0; i < course.sections.length; i++) {
                const section = course.sections[i];
                await pool.query(
                    'INSERT INTO units (id, course_id, title, order_index) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title)',
                    [section.id, course.id, section.title, i]
                );

                for (let j = 0; j < section.lessons.length; j++) {
                    const lesson = section.lessons[j];
                    await pool.query(
                        'INSERT INTO lessons (id, unit_id, title, video_id, duration, order_index) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title)',
                        [lesson.id, section.id, lesson.title, lesson.videoId, lesson.duration, j]
                    );
                }
            }
        }
        console.log('Database seeded successfully');
        await pool.end();
    } catch (err) {
        console.error('Seeding error:', err);
    }
}

seed();
