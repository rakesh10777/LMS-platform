import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit, Eye, Trash2, Plus, BookOpen, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { authApi } from '../services/api';
import './MyCourses.css';

const MyCourses = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => {
        if (user.role !== 'teacher') {
            navigate('/');
            return;
        }
        loadCourses();
    }, [user.id]);

    const loadCourses = async () => {
        try {
            const data = await authApi.getTeacherCourses(user.id);
            setCourses(data);
        } catch (err) {
            console.error('Failed to load courses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (courseId) => {
        console.log('Deleting course:', courseId);
        
        if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            return;
        }
        
        try {
            console.log('Calling delete API...');
            const result = await authApi.deleteCourse(courseId);
            console.log('Delete result:', result);
            setCourses(courses.filter(c => c.id !== courseId));
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete course: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="my-courses-container">
                <div className="loading-container">Loading...</div>
            </div>
        );
    }

    return (
        <div className="my-courses-container">
            <div className="my-courses-header">
                <div>
                    <h1>My Courses</h1>
                    <p>Manage your created courses</p>
                </div>
                <Link to="/add-course" className="add-course-link">
                    <Plus size={20} /> Add New Course
                </Link>
            </div>

            {courses.length === 0 ? (
                <div className="no-courses">
                    <BookOpen size={48} />
                    <h2>No courses yet</h2>
                    <p>Create your first course to start teaching</p>
                    <Link to="/add-course" className="create-course-btn">
                        <Plus size={18} /> Create Course
                    </Link>
                </div>
            ) : (
                <div className="courses-grid">
                    {courses.map(course => (
                        <div key={course.id} className="course-card">
                            <div className="course-thumbnail">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt={course.title} />
                                ) : (
                                    <div className="placeholder-thumb">
                                        <BookOpen size={32} />
                                    </div>
                                )}
                                <div className="course-price">
                                    {course.price > 0 ? `₹${course.price}` : 'Free'}
                                </div>
                            </div>
                            <div className="course-info">
                                <h3>{course.title}</h3>
                                <p className="course-category">{course.category}</p>
                                <div className="course-stats">
                                    <span><Users size={14} /> {course.lessonsCount || 0} lessons</span>
                                    <span><DollarSign size={14} /> {course.price > 0 ? `₹${course.price}` : 'Free'}</span>
                                </div>
                                <div className="course-actions">
                                    <Link to={`/course/${course.id}`} className="action-btn view">
                                        <Eye size={16} /> View
                                    </Link>
                                    <Link to={`/edit-course/${course.id}`} className="action-btn edit">
                                        <Edit size={16} /> Edit
                                    </Link>
                                    <button 
                                        className="action-btn delete"
                                        onClick={() => handleDelete(course.id)}
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyCourses;
