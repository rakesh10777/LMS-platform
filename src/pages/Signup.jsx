import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2, GraduationCap, Briefcase } from 'lucide-react';
import './Auth.css';
import { authApi } from '../services/api';

const Signup = ({ setAuth }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await authApi.signup(formData);
            localStorage.setItem('user', JSON.stringify(user));
            setAuth(true);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container animate-fade-in">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Create Account</h1>
                    <p>Join EduStream to start your learning journey</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <User className="input-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Full Name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="input-group">
                        <Mail className="input-icon" size={20} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="input-group">
                        <Lock className="input-icon" size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <div className="role-selection">
                        <p className="role-label">I am a:</p>
                        <div className="role-options">
                            <label className={`role-option ${formData.role === 'student' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="student"
                                    checked={formData.role === 'student'}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                />
                                <GraduationCap size={24} />
                                <span>Student</span>
                            </label>
                            <label className={`role-option ${formData.role === 'teacher' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="teacher"
                                    checked={formData.role === 'teacher'}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                />
                                <Briefcase size={24} />
                                <span>Teacher</span>
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <>Sign Up <ArrowRight size={18} /></>}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login">Login</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
