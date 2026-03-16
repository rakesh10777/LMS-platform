import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, Clock, Book, Loader2, Star, Users, Award, TrendingUp, Sparkles, Code, Palette, Briefcase, BarChart, Database, Globe, Flame, Zap, CheckCircle } from 'lucide-react';
import './Home.css';
import { authApi } from '../services/api';

const Home = ({ enrolledCourses }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('popular');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    useEffect(() => {
        authApi.getCourses()
            .then(data => {
                setCourses(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const tabs = [
        { id: 'popular', label: 'Popular', icon: Flame, color: '#f97316' },
        { id: 'newest', label: 'Newest', icon: Zap, color: '#10b981' },
        { id: 'free', label: 'Free Courses', icon: CheckCircle, color: '#667eea' },
        { id: 'all', label: 'View All', icon: Book, color: '#8b5cf6' },
    ];

    const filteredCourses = () => {
        let filtered = courses;
        
        if (selectedCategory) {
            filtered = filtered.filter(c => 
                c.category && c.category.toLowerCase() === selectedCategory.toLowerCase()
            );
        }
        
        switch (activeTab) {
            case 'newest':
                return [...filtered].reverse();
            case 'free':
                return filtered.filter(c => !c.price || c.price === 0);
            case 'all':
                return filtered;
            default:
                return filtered;
        }
    };

    const categories = [
        { name: 'Programming', icon: Code, color: '#667eea', count: '50+ Courses' },
        { name: 'Design', icon: Palette, color: '#f97316', count: '30+ Courses' },
        { name: 'Business', icon: Briefcase, color: '#10b981', count: '40+ Courses' },
        { name: 'Marketing', icon: TrendingUp, color: '#ec4899', count: '25+ Courses' },
        { name: 'Data Science', icon: Database, color: '#8b5cf6', count: '35+ Courses' },
        { name: 'Languages', icon: Globe, color: '#06b6d4', count: '20+ Courses' },
    ];

    const stats = [
        { icon: Users, value: '50K+', label: 'Students' },
        { icon: Book, value: '200+', label: 'Courses' },
        { icon: Award, value: '15K+', label: 'Certificates' },
        { icon: Star, value: '4.8', label: 'Rating' },
    ];

    if (loading) {
        return (
            <div className="loading-container">
                <Loader2 className="animate-spin" size={48} />
                <p>Loading amazing courses...</p>
            </div>
        );
    }

    return (
        <div className="home-page animate-fade-in">
            <header className="hero-section">
                <h1>{user ? `Welcome back, ${user.name}!` : 'Welcome to EduStream!'}</h1>
                <p>{user ? 'Pick up where you left off or start a new learning journey today.' : 'Unlock your potential with our masterclasses.'}</p>
                {!user && (
                    <div className="hero-actions">
                        <Link to="/signup" className="hero-signup-btn">Get Started for Free</Link>
                    </div>
                )}
            </header>

            <div className="stats-section">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-item">
                        <stat.icon size={28} />
                        <span className="stat-value">{stat.value}</span>
                        <span className="stat-label">{stat.label}</span>
                    </div>
                ))}
            </div>

            <section className="categories-section">
                <div className="section-header">
                    <h2><Sparkles size={24} /> Browse Categories</h2>
                    {selectedCategory && (
                        <button 
                            className="clear-filter-btn"
                            onClick={() => setSelectedCategory(null)}
                        >
                            Clear: {selectedCategory}
                        </button>
                    )}
                </div>
                <div className="categories-grid">
                    {categories.map((cat, index) => (
                        <div 
                            key={index} 
                            className={`category-card ${selectedCategory === cat.name ? 'active' : ''}`} 
                            style={{ '--accent': cat.color, cursor: 'pointer' }}
                            onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                        >
                            <div className="category-icon">
                                <cat.icon size={32} />
                            </div>
                            <h3>{cat.name}</h3>
                            <p>{cat.count}</p>
                        </div>
                    ))}
                </div>
            </section>

            <div className="section-divider">
                <div className="divider-line"></div>
                <div className="divider-icon">
                    <Sparkles size={20} />
                </div>
                <div className="divider-line"></div>
            </div>

            <section className="courses-section">
                <div className="courses-header">
                    <div className="category-indicator">
                        {selectedCategory && (
                            <span className="active-category">
                                Category: {selectedCategory}
                                <button onClick={() => setSelectedCategory(null)} className="clear-x">×</button>
                            </span>
                        )}
                    </div>
                    <div className="tabs-container">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                                style={{ '--tab-color': tab.color }}
                            >
                                <tab.icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid">
                    {courses.length === 0 ? (
                        <div className="empty-state">
                            <Book size={64} />
                            <h3>No courses available yet</h3>
                            <p>Check back soon for new courses!</p>
                        </div>
                    ) : (
                        filteredCourses().map(course => (
                            <div key={course.id} className="course-card">
                                <div className="card-image">
                                    <img src={course.thumbnail} alt={course.title} />
                                    <div className="category-tag">{course.category}</div>
                                </div>
                                <div className="card-content">
                                    <div className="card-meta">
                                        <span><Clock size={14} /> {course.duration}</span>
                                        <span><Book size={14} /> {course.lessonsCount} Lessons</span>
                                    </div>
                                    <h3>{course.title}</h3>
                                    <p className="instructor">By {course.instructor}</p>
                                    <p className="short-desc">{course.description}</p>

                                    <div className="card-footer">
                                        <span className="course-price">{course.price > 0 ? `₹${course.price}` : 'Free'}</span>
                                        <Link to={`/course/${course.id}`} className="details-btn">
                                            View Details
                                        </Link>
                                        {enrolledCourses.includes(course.id) ? (
                                            <Link to={`/learn/${course.id}`} className="enroll-btn enrolled">
                                                <PlayCircle size={18} /> Continue
                                            </Link>
                                        ) : (
                                            <Link to={`/course/${course.id}`} className="enroll-btn">
                                                Enroll Now
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                {filteredCourses().length === 0 && (
                    <div className="no-courses">
                        <Book size={48} />
                        <p>No courses found in this category</p>
                    </div>
                )}
            </section>

            <div className="section-divider">
                <div className="divider-line"></div>
                <div className="divider-icon">
                    <Sparkles size={20} />
                </div>
                <div className="divider-line"></div>
            </div>

            <section className="cta-section">
                <div className="cta-content">
                    <h2>Start Learning Today</h2>
                    <p>Join thousands of students already learning on EduStream</p>
                    <div className="cta-buttons">
                        <Link to="/signup" className="cta-primary">Get Started</Link>
                        <Link to="/" className="cta-secondary">Explore Courses</Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
