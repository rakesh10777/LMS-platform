const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDB() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'teacher') DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    try {
      await connection.query(`ALTER TABLE users ADD COLUMN role ENUM('student', 'teacher') DEFAULT 'student'`);
    } catch (e) {
      // Column might already exist, ignore error
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        instructor VARCHAR(255),
        thumbnail TEXT,
        description TEXT,
        category VARCHAR(100),
        price DECIMAL(10,2) DEFAULT 0,
        instructor_id INT
      )
    `).catch(() => {});

    try {
      await connection.query(`ALTER TABLE courses ADD COLUMN price DECIMAL(10,2) DEFAULT 0`);
    } catch (e) {}

    try {
      await connection.query(`ALTER TABLE courses ADD COLUMN instructor_id INT`);
    } catch (e) {}

    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        course_id VARCHAR(50),
        amount DECIMAL(10,2),
        payment_method VARCHAR(50),
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (course_id) REFERENCES courses(id)
      )
    `).catch(() => {});

    await connection.query(`
      CREATE TABLE IF NOT EXISTS units (
        id VARCHAR(50) PRIMARY KEY,
        course_id VARCHAR(50),
        title VARCHAR(255),
        order_index INT,
        FOREIGN KEY (course_id) REFERENCES courses(id)
      )
    `).catch(() => {});

    await connection.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id VARCHAR(50) PRIMARY KEY,
        unit_id VARCHAR(50),
        title VARCHAR(255),
        video_id VARCHAR(50),
        duration VARCHAR(20),
        description TEXT,
        order_index INT,
        FOREIGN KEY (unit_id) REFERENCES units(id)
      )
    `).catch(() => {});

    try {
      await connection.query(`ALTER TABLE lessons ADD COLUMN description TEXT`);
    } catch (e) {}

    await connection.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        user_id INT,
        course_id VARCHAR(50),
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, course_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (course_id) REFERENCES courses(id)
      )
    `).catch(() => {});

    await connection.query(`
      CREATE TABLE IF NOT EXISTS progress (
        user_id INT,
        lesson_id VARCHAR(50),
        completed BOOLEAN DEFAULT TRUE,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, lesson_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (lesson_id) REFERENCES lessons(id)
      )
    `).catch(() => {});

    connection.release();
    console.log('Database tables initialized');
  } catch (err) {
    console.error('Database initialization error:', err.message);
  }
}

initDB();

app.get('/', (req, res) => {
  res.send('LMS Backend API is running');
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working',
    youtubeApiKey: !!process.env.YOUTUBE_API_KEY
  });
});

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const userRole = role === 'teacher' ? 'teacher' : 'student';
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, userRole]
    );
    res.status(201).json({ id: result.insertId, name, email, role: userRole });
  } catch (err) {
    console.error('Signup error:', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const role = users[0].role || 'student';
    res.json({ id: users[0].id, name: users[0].name, email: users[0].email, role });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/api/courses', async (req, res) => {
  try {
    const [courses] = await pool.query(`
      SELECT c.*, 
      (SELECT COUNT(*) FROM lessons l JOIN units u ON l.unit_id = u.id WHERE u.course_id = c.id) as lessonsCount,
      '24 Hours' as duration
      FROM courses c
    `);
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  console.log('DELETE request received for course:', req.params.id);
  try {
    const [result] = await pool.query('SELECT id FROM courses WHERE id = ?', [req.params.id]);
    console.log('Course found:', result);
    
    if (result.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    await pool.query('DELETE FROM lessons WHERE unit_id IN (SELECT id FROM units WHERE course_id = ?)', [req.params.id]);
    await pool.query('DELETE FROM units WHERE course_id = ?', [req.params.id]);
    await pool.query('DELETE FROM enrollments WHERE course_id = ?', [req.params.id]);
    await pool.query('DELETE FROM orders WHERE course_id = ?', [req.params.id]);
    await pool.query('DELETE FROM courses WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Course deleted' });
  } catch (err) {
    console.error('Delete course error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const [courses] = await pool.query('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    if (courses.length === 0) return res.status(404).json({ message: 'Course not found' });

    const [units] = await pool.query('SELECT * FROM units WHERE course_id = ? ORDER BY order_index', [req.params.id]);

    for (const unit of units) {
      const [lessons] = await pool.query('SELECT * FROM lessons WHERE unit_id = ? ORDER BY order_index', [unit.id]);
      unit.lessons = lessons.map(l => ({
        ...l,
        videoId: l.video_id,
        id: l.id
      }));
    }

    courses[0].sections = units;
    res.json(courses[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/api/user/:userId/data', async (req, res) => {
  try {
    const [enrollments] = await pool.query('SELECT course_id FROM enrollments WHERE user_id = ?', [req.params.userId]);
    const [progress] = await pool.query('SELECT lesson_id FROM progress WHERE user_id = ?', [req.params.userId]);

    const progressMap = {};
    progress.forEach(p => {
      progressMap[p.lesson_id] = true;
    });

    res.json({
      enrolledCourses: enrollments.map(e => e.course_id),
      progress: progressMap
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/api/enroll', async (req, res) => {
  const { userId, courseId } = req.body;
  try {
    await pool.query('INSERT IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)', [userId, courseId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/api/progress', async (req, res) => {
  const { userId, lessonId } = req.body;
  try {
    await pool.query('INSERT IGNORE INTO progress (user_id, lesson_id) VALUES (?, ?)', [userId, lessonId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/api/courses', async (req, res) => {
  const { title, instructor, thumbnail, description, category, sections, price, instructorId } = req.body;
  const courseId = 'course_' + Date.now();
  try {
    await pool.query(
      'INSERT INTO courses (id, title, instructor, thumbnail, description, category, price, instructor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [courseId, title, instructor, thumbnail, description, category, price || 0, instructorId]
    );

    if (sections && sections.length > 0) {
      for (let i = 0; i < sections.length; i++) {
        const unit = sections[i];
        const unitId = 'unit_' + Date.now() + '_' + i;
        await pool.query(
          'INSERT INTO units (id, course_id, title, order_index) VALUES (?, ?, ?, ?)',
          [unitId, courseId, unit.title, i]
        );

        if (unit.lessons && unit.lessons.length > 0) {
          for (let j = 0; j < unit.lessons.length; j++) {
            const lesson = unit.lessons[j];
            const lessonId = 'lesson_' + Date.now() + '_' + i + '_' + j;
            await pool.query(
              'INSERT INTO lessons (id, unit_id, title, video_id, duration, description, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [lessonId, unitId, lesson.title, lesson.videoId, lesson.duration || '', lesson.description || '', j]
            );
          }
        }
      }
    }

    res.status(201).json({ success: true, courseId });
  } catch (err) {
    console.error('Add course error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.put('/api/courses/:id', async (req, res) => {
  const { title, instructor, thumbnail, description, category, price, sections } = req.body;
  try {
    await pool.query(
      'UPDATE courses SET title = ?, instructor = ?, thumbnail = ?, description = ?, category = ?, price = ? WHERE id = ?',
      [title, instructor, thumbnail, description, category, price || 0, req.params.id]
    );

    await pool.query('DELETE FROM lessons WHERE unit_id IN (SELECT id FROM units WHERE course_id = ?)', [req.params.id]);
    await pool.query('DELETE FROM units WHERE course_id = ?', [req.params.id]);

    if (sections && sections.length > 0) {
      for (let i = 0; i < sections.length; i++) {
        const unit = sections[i];
        const unitId = 'unit_' + Date.now() + '_' + i;
        await pool.query(
          'INSERT INTO units (id, course_id, title, order_index) VALUES (?, ?, ?, ?)',
          [unitId, req.params.id, unit.title, i]
        );

        if (unit.lessons && unit.lessons.length > 0) {
          for (let j = 0; j < unit.lessons.length; j++) {
            const lesson = unit.lessons[j];
            const lessonId = 'lesson_' + Date.now() + '_' + i + '_' + j;
            await pool.query(
              'INSERT INTO lessons (id, unit_id, title, video_id, duration, description, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [lessonId, unitId, lesson.title, lesson.videoId, lesson.duration || '', lesson.description || '', j]
            );
          }
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Update course error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/api/teacher/courses/:teacherId', async (req, res) => {
  try {
    const [courses] = await pool.query(
      'SELECT * FROM courses WHERE instructor_id = ?',
      [req.params.teacherId]
    );
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/api/purchase', async (req, res) => {
  const { userId, courseId, paymentMethod, amount } = req.body;
  try {
    const [existing] = await pool.query(
      'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Already enrolled' });
    }

    await pool.query(
      'INSERT INTO orders (user_id, course_id, amount, payment_method) VALUES (?, ?, ?, ?)',
      [userId, courseId, amount, paymentMethod]
    );
    
    await pool.query(
      'INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)',
      [userId, courseId]
    );

    res.json({ success: true, message: 'Purchase successful' });
  } catch (err) {
    console.error('Purchase error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/api/analyze-url', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ message: 'API key not configured' });
    }

    const parseDuration = (isoDuration) => {
      if (!isoDuration) return '';
      const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return '';
      const hours = parseInt(match[1] || 0);
      const minutes = parseInt(match[2] || 0);
      const seconds = parseInt(match[3] || 0);
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const playlistMatch = url.match(/[?&]list=([^&\s]+)/);
    const videoMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
    
    const playlistId = playlistMatch ? playlistMatch[1] : null;
    const videoId = videoMatch ? videoMatch[1] : null;
    
    if (!playlistId && !videoId) {
      return res.status(400).json({ message: 'Invalid YouTube URL' });
    }

    const videos = [];
    
    if (playlistId) {
      const fetchUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
      const resp = await fetch(fetchUrl);
      const data = await resp.json();
      
      if (data.error) return res.status(400).json({ message: data.error.message });
      
      const videoIds = [];
      if (data.items) {
        for (const item of data.items) {
          if (item.snippet?.resourceId?.videoId) {
            videoIds.push(item.snippet.resourceId.videoId);
          }
        }
      }
      
      let videoDetails = {};
      if (videoIds.length > 0) {
        const detailsResp = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds.join(',')}&key=${apiKey}`
        );
        const detailsData = await detailsResp.json();
        if (detailsData.items) {
          for (const item of detailsData.items) {
            videoDetails[item.id] = {
              duration: parseDuration(item.contentDetails?.duration),
              description: item.snippet?.description || ''
            };
          }
        }
      }
      
      if (data.items) {
        for (const item of data.items) {
          if (item.snippet?.resourceId?.videoId) {
            const vid = item.snippet.resourceId.videoId;
            videos.push({
              title: item.snippet.title,
              videoId: vid,
              thumbnail: item.snippet.thumbnails?.medium?.url || '',
              duration: videoDetails[vid]?.duration || '',
              description: videoDetails[vid]?.description || ''
            });
          }
        }
      }
      
      const infoResp = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`);
      const infoData = await infoResp.json();
      if (infoData.items?.[0]?.snippet) {
        return res.json({
          title: infoData.items[0].snippet.title,
          thumbnail: infoData.items[0].snippet.thumbnails?.medium?.url || '',
          sections: [{ title: 'Section 1', lessons: videos }]
        });
      }
    }
    
    if (videoId) {
      const resp = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`);
      const data = await resp.json();
      
      if (data.error) return res.status(400).json({ message: data.error.message });
      
      if (data.items?.[0]?.snippet) {
        const video = data.items[0];
        const duration = parseDuration(video.contentDetails?.duration);
        const description = video.snippet?.description || '';
        return res.json({
          title: video.snippet.title,
          thumbnail: video.snippet.thumbnails?.medium?.url || '',
          sections: [{ title: 'Section 1', lessons: [{ title: video.snippet.title, videoId, duration, description }] }]
        });
      }
    }
    
    res.json({ sections: [], title: '', thumbnail: '' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: err.toString() });
  }
});

app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});
