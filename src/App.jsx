import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CourseDetails from './pages/CourseDetails';
import LearningArea from './pages/LearningArea';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AddCourse from './pages/AddCourse';
import MyCourses from './pages/MyCourses';
import Chatbot from './components/Chatbot';
import CodingPlayground from './pages/CodingPlayground';
import { authApi } from './services/api';
import './App.css';

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('user') !== null;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.id) {
        authApi.getUserData(user.id).then(data => {
          setEnrolledCourses(data.enrolledCourses || []);
          setProgress(data.progress || {});
        });
      }
    } else {
      setEnrolledCourses([]);
      setProgress({});
    }
  }, [isAuthenticated]);

  const enrollInCourse = async (courseId) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    if (!enrolledCourses.includes(courseId)) {
      setEnrolledCourses([...enrolledCourses, courseId]);
      await authApi.enroll(user.id, courseId);
    }
  };

  const markLessonComplete = async (courseId, lessonId) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    if (!progress[lessonId]) {
      setProgress(prev => ({
        ...prev,
        [lessonId]: true
      }));
      await authApi.updateProgress(user.id, lessonId);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar
          isAuthenticated={isAuthenticated}
          logout={logout}
          theme={theme}
          toggleTheme={toggleTheme}
          userRole={JSON.parse(localStorage.getItem('user') || '{}').role}
        />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home enrolledCourses={enrolledCourses} />} />
            <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
            <Route path="/signup" element={<Signup setAuth={setIsAuthenticated} />} />
            <Route
              path="/course/:id"
              element={<CourseDetails enrolledCourses={enrolledCourses} enroll={enrollInCourse} />}
            />
            <Route
              path="/learn/:id"
              element={<LearningArea progress={progress} markComplete={markLessonComplete} />}
            />
            <Route path="/add-course" element={<AddCourse />} />
            <Route path="/edit-course/:id" element={<AddCourse />} />
            <Route path="/my-courses" element={<MyCourses />} />
            <Route path="/coding" element={<CodingPlayground />} />
          </Routes>
        </main>
        {isAuthenticated && JSON.parse(localStorage.getItem('user') || '{}').role === 'student' && <Chatbot />}
      </div>
    </Router>
  );
}

export default App;
