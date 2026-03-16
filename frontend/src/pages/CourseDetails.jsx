import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, BookOpen, User, ChevronRight, Loader2, CreditCard } from 'lucide-react';
import './CourseDetails.css';
import { authApi } from '../services/api';

const CourseDetails = ({ enrolledCourses, enroll }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('card');

    useEffect(() => {
        authApi.getCourseDetails(id)
            .then(data => {
                setCourse(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="loading-container">
                <Loader2 className="animate-spin" size={48} />
                <p>Loading course information...</p>
            </div>
        );
    }

    if (!course) return <div className="p-8">Course not found</div>;

    const isEnrolled = enrolledCourses.includes(course.id);
    const isFree = !course.price || course.price === 0;

    const handleEnroll = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            navigate('/login');
            return;
        }
        if (!isFree) {
            setShowPayment(true);
            return;
        }
        await enroll(course.id);
        navigate(`/learn/${course.id}`);
    };

    const handlePurchase = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            navigate('/login');
            return;
        }
        setPurchasing(true);
        try {
            await authApi.purchaseCourse({
                userId: user.id,
                courseId: course.id,
                paymentMethod,
                amount: course.price
            });
            setShowPayment(false);
            navigate(`/learn/${course.id}`);
        } catch (err) {
            alert(err.message);
        } finally {
            setPurchasing(false);
        }
    };

    return (
        <div className="course-details animate-fade-in">
            <div className="details-header">
                <div className="breadcrumb">
                    <span>Courses</span> <ChevronRight size={14} /> <span>{course.category}</span>
                </div>
                <h1>{course.title}</h1>
                <div className="header-meta">
                    <span className="instructor-meta"><User size={16} /> {course.instructor}</span>
                    <span><Clock size={16} /> {course.duration}</span>
                    <span><BookOpen size={16} /> {course.lessonsCount} lessons</span>
                </div>
            </div>

            <div className="details-layout">
                <div className="details-main">
                    <section className="description">
                        <h2>Course Description</h2>
                        <p>{course.longDescription}</p>
                    </section>

                    <section className="learning-outcomes">
                        <h2>What you'll learn</h2>
                        <div className="outcomes-grid">
                            <div className="outcome"><CheckCircle size={18} /> Deep understanding of core concepts</div>
                            <div className="outcome"><CheckCircle size={18} /> Practical real-world projects</div>
                            <div className="outcome"><CheckCircle size={18} /> Industry best practices</div>
                            <div className="outcome"><CheckCircle size={18} /> Advanced troubleshooting</div>
                        </div>
                    </section>

                    <section className="curriculum">
                        <h2>Curriculum</h2>
                        {course.sections.map(section => (
                            <div key={section.id} className="section-list">
                                <h3>{section.title}</h3>
                                <div className="lessons">
                                    {section.lessons.map((lesson, idx) => (
                                        <div key={lesson.id} className="lesson-item">
                                            <span className="lesson-idx">{idx + 1}</span>
                                            <span className="lesson-name">{lesson.title}</span>
                                            <span className="lesson-duration">{lesson.duration}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </section>
                </div>

                <div className="details-sidebar">
                    <div className="enroll-card">
                        <img src={course.thumbnail} alt={course.title} />
                        <div className="enroll-content">
                            <div className="price">{isFree ? 'Free' : `₹${course.price}`}</div>
                            {isEnrolled ? (
                                <button className="primary-btn enrolled-btn" onClick={() => navigate(`/learn/${course.id}`)}>
                                    Continue Learning
                                </button>
                            ) : (
                                <button className="primary-btn" onClick={handleEnroll}>
                                    {isFree ? 'Enroll for Free' : 'Buy Now'}
                                </button>
                            )}
                            <ul className="perks">
                                <li>Full lifetime access</li>
                                <li>Access on mobile and TV</li>
                                <li>Certificate of completion</li>
                            </ul>
                        </div>
                    </div>
                </div>

            {showPayment && (
                <div className="payment-modal">
                    <div className="payment-content">
                        <h2>Payment</h2>
                        <p className="payment-amount">Amount: <strong>₹{course.price}</strong></p>
                        
                        <div className="payment-methods">
                            <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                                <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                                <CreditCard size={20} />
                                <span>Credit/Debit Card</span>
                            </label>
                            <label className={`payment-option ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                                <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                                <span>UPI</span>
                            </label>
                            <label className={`payment-option ${paymentMethod === 'netbanking' ? 'selected' : ''}`}>
                                <input type="radio" name="payment" value="netbanking" checked={paymentMethod === 'netbanking'} onChange={() => setPaymentMethod('netbanking')} />
                                <span>Net Banking</span>
                            </label>
                        </div>

                        <div className="payment-actions">
                            <button className="cancel-btn" onClick={() => setShowPayment(false)}>Cancel</button>
                            <button className="pay-btn" onClick={handlePurchase} disabled={purchasing}>
                                {purchasing ? 'Processing...' : `Pay ₹${course.price}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default CourseDetails;
