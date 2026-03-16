import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, Loader2, Youtube, Clock, BookOpen, DollarSign, Sparkles, Link } from 'lucide-react';
import { authApi } from '../services/api';
import './AddCourse.css';

const AddCourse = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isEdit = Boolean(id);
    
    if (user.role !== 'teacher') {
        navigate('/');
        return null;
    }

    const [formData, setFormData] = useState({
        title: '',
        instructor: user.name || '',
        thumbnail: '',
        description: '',
        category: '',
        price: 0,
        sections: [],
        instructorId: user.id
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analyzeUrl, setAnalyzeUrl] = useState('');
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        if (id) {
            loadCourse(id);
        }
    }, [id]);

    const loadCourse = async (courseId) => {
        try {
            const course = await authApi.getCourseDetails(courseId);
            setFormData({
                title: course.title || '',
                instructor: course.instructor || '',
                thumbnail: course.thumbnail || '',
                description: course.description || '',
                category: course.category || '',
                price: course.price || 0,
                sections: course.sections || [],
                instructorId: user.id
            });
        } catch (err) {
            console.error('Failed to load course:', err);
        }
    };

    const addSection = () => {
        setFormData({
            ...formData,
            sections: [...formData.sections, { title: '', lessons: [] }]
        });
    };

    const addLesson = (sectionIndex) => {
        const newSections = [...formData.sections];
        newSections[sectionIndex].lessons.push({
            title: '',
            videoId: '',
            duration: ''
        });
        setFormData({ ...formData, sections: newSections });
    };

    const updateSection = (index, field, value) => {
        const newSections = [...formData.sections];
        newSections[index][field] = value;
        setFormData({ ...formData, sections: newSections });
    };

    const updateLesson = (sectionIndex, lessonIndex, field, value) => {
        const newSections = [...formData.sections];
        newSections[sectionIndex].lessons[lessonIndex][field] = value;
        setFormData({ ...formData, sections: newSections });
    };

    const removeSection = (index) => {
        const newSections = formData.sections.filter((_, i) => i !== index);
        setFormData({ ...formData, sections: newSections });
    };

    const removeLesson = (sectionIndex, lessonIndex) => {
        const newSections = [...formData.sections];
        newSections[sectionIndex].lessons = newSections[sectionIndex].lessons.filter((_, i) => i !== lessonIndex);
        setFormData({ ...formData, sections: newSections });
    };

    const handleAnalyzeUrl = async () => {
        if (!analyzeUrl.trim()) return;
        
        setAnalyzing(true);
        setError('');
        
        try {
            const result = await authApi.analyzeUrl(analyzeUrl);
            
            if (result.sections && result.sections.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    title: result.title || prev.title,
                    thumbnail: result.thumbnail || prev.thumbnail,
                    sections: result.sections
                }));
                setAnalyzeUrl('');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const extractVideoId = (url) => {
        if (!url) return '';
        
        const videoIdPatterns = [
            /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
            /(?:youtu\.be\/)([^&\s?]+)/,
            /(?:youtube\.com\/embed\/)([^&\s?]+)/,
            /(?:youtube\.com\/v\/)([^&\s?]+)/,
        ];
        
        for (const pattern of videoIdPatterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        return url;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const courseData = {
            ...formData,
            sections: formData.sections.map(section => ({
                ...section,
                lessons: section.lessons.map(lesson => {
                    const vid = lesson.videoId || '';
                    const extracted = extractVideoId(vid);
                    console.log('Video URL:', vid, '-> Extracted:', extracted);
                    return {
                        ...lesson,
                        videoId: extracted
                    };
                })
            }))
        };

        console.log('Submitting course data:', JSON.stringify(courseData, null, 2));

        try {
            if (isEdit) {
                await authApi.updateCourse(id, courseData);
            } else {
                await authApi.addCourse(courseData);
            }
            navigate('/my-courses');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-course-container">
            <div className="add-course-card">
                <div className="add-course-header">
                    <h1>{isEdit ? 'Edit Course' : 'Add New Course'}</h1>
                    <p>{isEdit ? 'Update your course details' : 'Create a new course with sections and lessons'}</p>
                </div>

                {error && <div className="add-course-error">{error}</div>}

                {!isEdit && (
                    <div className="form-section url-analyzer-section">
                        <h3><Sparkles size={20} /> AI Course Builder</h3>
                        <p className="section-hint">Paste a YouTube playlist or video URL to automatically create sections and lessons</p>
                        
                        <div className="url-input-group">
                            <Link className="input-icon" size={20} />
                            <input
                                type="url"
                                placeholder="Paste YouTube Playlist URL (e.g., https://youtube.com/playlist?list=...)"
                                value={analyzeUrl}
                                onChange={(e) => setAnalyzeUrl(e.target.value)}
                            />
                            <button 
                                type="button" 
                                className="analyze-btn"
                                onClick={handleAnalyzeUrl}
                                disabled={analyzing || !analyzeUrl.trim()}
                            >
                                {analyzing ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <><Sparkles size={18} /> Analyze</>
                                )}
                            </button>
                        </div>
                        <p className="url-hint">Supports YouTube playlists and single videos</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="add-course-form">
                    <div className="form-section">
                        <h3>Course Details</h3>
                        
                        <div className="input-group">
                            <BookOpen className="input-icon" size={20} />
                            <input
                                type="text"
                                placeholder="Course Title"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Instructor Name"
                                required
                                value={formData.instructor}
                                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Thumbnail URL (optional)"
                                value={formData.thumbnail}
                                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <select
                                required
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="">Select Category</option>
                                <option value="Programming">Programming</option>
                                <option value="Design">Design</option>
                                <option value="Business">Business</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Data Science">Data Science</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <DollarSign className="input-icon" size={20} />
                            <input
                                type="number"
                                placeholder="Price (₹)"
                                min="0"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <textarea
                                placeholder="Course Description"
                                rows="3"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="sections-header">
                            <h3>Sections & Lessons</h3>
                            <button type="button" className="add-section-btn" onClick={addSection}>
                                <Plus size={18} /> Add Section
                            </button>
                        </div>

                        {formData.sections.map((section, sectionIndex) => (
                            <div key={sectionIndex} className="section-block">
                                <div className="section-header">
                                    <input
                                        type="text"
                                        placeholder={`Section ${sectionIndex + 1} Title`}
                                        required
                                        value={section.title}
                                        onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                                    />
                                    <button type="button" className="remove-btn" onClick={() => removeSection(sectionIndex)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="lessons-container">
                                    {section.lessons.map((lesson, lessonIndex) => (
                                        <div key={lessonIndex} className="lesson-block">
                                            <div className="lesson-inputs">
                                                <div className="lesson-field">
                                                    <Youtube size={18} className="field-icon" />
                                                    <input
                                                        type="text"
                                                        placeholder="YouTube URL"
                                                        required
                                                        value={lesson.videoId}
                                                        onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'videoId', e.target.value)}
                                                    />
                                                </div>
                                                <div className="lesson-field">
                                                    <Clock size={18} className="field-icon" />
                                                    <input
                                                        type="text"
                                                        placeholder="Duration (e.g., 10:30)"
                                                        required
                                                        value={lesson.duration}
                                                        onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'duration', e.target.value)}
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Lesson Title"
                                                    required
                                                    className="lesson-title-input"
                                                    value={lesson.title}
                                                    onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'title', e.target.value)}
                                                />
                                                <textarea
                                                    placeholder="Lesson Description (optional)"
                                                    className="lesson-description-input"
                                                    value={lesson.description || ''}
                                                    onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'description', e.target.value)}
                                                />
                                            </div>
                                            <button type="button" className="remove-lesson-btn" onClick={() => removeLesson(sectionIndex, lessonIndex)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}

                                    <button type="button" className="add-lesson-btn" onClick={() => addLesson(sectionIndex)}>
                                        <Plus size={16} /> Add Lesson
                                    </button>
                                </div>
                            </div>
                        ))}

                        {formData.sections.length === 0 && (
                            <p className="no-sections">No sections added yet. Click "Add Section" to begin.</p>
                        )}
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Create Course</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddCourse;
