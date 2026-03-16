import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Play, ChevronLeft, Menu, X, Loader2 } from 'lucide-react';
import './LearningArea.css';
import { authApi } from '../services/api';

const LearningArea = ({ progress, markComplete }) => {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeLesson, setActiveLesson] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        authApi.getCourseDetails(id)
            .then(data => {
                console.log('Course data:', JSON.stringify(data, null, 2));
                setCourse(data);
                if (data.sections?.length > 0 && data.sections[0].lessons?.length > 0) {
                    const firstLesson = data.sections[0].lessons[0];
                    console.log('First lesson:', firstLesson);
                    setActiveLesson(firstLesson);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="loading-container dark-mode">
                <Loader2 className="animate-spin" size={48} />
                <p>Establishing secure link to course...</p>
            </div>
        );
    }

    if (!course) return <div className="p-8">Course not found</div>;

    const completedCount = Object.keys(progress).filter(lessonId => {
        // Find if this lessonId belongs to any section of the current course
        return course.sections.some(s => s.lessons.some(l => l.id === lessonId));
    }).length;

    const totalLessons = course.sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);
    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    const handleLessonComplete = () => {
        markComplete(course.id, activeLesson.id);
    };

    return (
        <div className={`learning-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <div className="learning-main">
                <header className="learning-header">
                    <Link to={`/course/${course.id}`} className="back-link">
                        <ChevronLeft size={20} /> Back to Course
                    </Link>
                    <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </header>

                <div className="video-container">
                    {activeLesson && activeLesson.videoId && (
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${activeLesson.videoId.trim()}?rel=0`}
                            title={activeLesson.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    )}
                    {activeLesson && !activeLesson.videoId && (
                        <div className="no-video">
                            <p>No video available for this lesson</p>
                            <p className="debug-info">Lesson ID: {activeLesson.id}</p>
                        </div>
                    )}
                    {!activeLesson && (
                        <div className="no-video">
                            <p>No lesson selected</p>
                        </div>
                    )}
                </div>

                <div className="learning-footer">
                    <div className="lesson-info">
                        <h1>{activeLesson?.title}</h1>
                        <p>{course.title}</p>
                    </div>
                    <div className="action-buttons">
                        <button
                            className={`complete-btn ${progress[activeLesson?.id] ? 'completed' : ''}`}
                            onClick={handleLessonComplete}
                        >
                            <CheckCircle size={20} />
                            {progress[activeLesson?.id] ? 'Completed' : 'Mark as Complete'}
                        </button>
                    </div>
                </div>
            </div>

            <aside className="learning-sidebar">
                <div className="sidebar-header">
                    <h3>Course Content</h3>
                    <div className="progress-mini">
                        <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <span>{progressPercent}% Complete</span>
                    </div>
                </div>

                <div className="sidebar-content">
                    {course.sections.map(section => (
                        <div key={section.id} className="sidebar-section">
                            <h4>{section.title}</h4>
                            <div className="sidebar-lessons">
                                {section.lessons.map(lesson => (
                                    <button
                                        key={lesson.id}
                                        className={`sidebar-lesson-item ${activeLesson?.id === lesson.id ? 'active' : ''}`}
                                        onClick={() => setActiveLesson(lesson)}
                                    >
                                        <div className="lesson-status">
                                            {progress[lesson.id] ? (
                                                <CheckCircle size={18} className="done" />
                                            ) : (
                                                <Play size={18} />
                                            )}
                                        </div>
                                        <div className="lesson-title-box">
                                            <span className="lesson-title">{lesson.title}</span>
                                            <span className="lesson-dur">{lesson.duration}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </aside>
        </div>
    );
};

export default LearningArea;
