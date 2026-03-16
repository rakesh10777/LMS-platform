import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, User, Bell, Search, LogOut, Sun, Moon, PlusCircle, LayoutDashboard, Code } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ isAuthenticated, logout, theme, toggleTheme, userRole }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <BookOpen size={28} className="logo-icon" />
                    <span>EduStream</span>
                </Link>

                <div className="navbar-search">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Search for courses..." />
                </div>

                <div className="navbar-actions">
                    <button className="nav-btn theme-toggle" onClick={toggleTheme}>
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                    {isAuthenticated ? (
                        <>
                            {userRole === 'student' && (
                                <Link to="/coding" className="nav-btn" title="Coding Practice">
                                    <Code size={20} />
                                </Link>
                            )}
                            {userRole === 'teacher' && (
                                <>
                                    <Link to="/my-courses" className="nav-btn" title="My Courses">
                                        <LayoutDashboard size={20} />
                                    </Link>
                                    <Link to="/add-course" className="nav-btn add-course-btn" title="Add Course">
                                        <PlusCircle size={20} />
                                    </Link>
                                </>
                            )}
                            <button className="nav-btn"><Bell size={20} /></button>
                            <div className="user-profile">
                                <User size={20} />
                                <span className="user-name">{user.name || 'Rakesh'}</span>
                                <button
                                    onClick={() => {
                                        console.log('Logout clicked');
                                        logout();
                                    }}
                                    className="logout-btn"
                                    title="Logout"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="auth-btns">
                            <Link to="/login" className="login-link">Login</Link>
                            <Link to="/signup" className="signup-btn">Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
