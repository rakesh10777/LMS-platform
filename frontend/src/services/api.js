const API_URL = import.meta.env.VITE_API_URL || '/api';

const handleResponse = async (response) => {
    const text = await response.text();
    console.log('API Response:', response.url, response.status, text.substring(0, 100));
    try {
        const data = JSON.parse(text);
        if (!response.ok) {
            throw new Error(data.message || `Error ${response.status}`);
        }
        return data;
    } catch (e) {
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
            throw new Error('Backend not running. Start server with: cd backend && node server.js');
        }
        throw new Error(e.message || text.substring(0, 50));
    }
};

export const authApi = {
    signup: async (userData) => {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        return handleResponse(response);
    },

    login: async (credentials) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        return handleResponse(response);
    },

    getCourses: async () => {
        const response = await fetch(`${API_URL}/courses`);
        return handleResponse(response);
    },

    getCourseDetails: async (id) => {
        const response = await fetch(`${API_URL}/courses/${id}`);
        return handleResponse(response);
    },

    getUserData: async (userId) => {
        const response = await fetch(`${API_URL}/user/${userId}/data`);
        return handleResponse(response);
    },

    enroll: async (userId, courseId) => {
        const response = await fetch(`${API_URL}/enroll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, courseId }),
        });
        return handleResponse(response);
    },

    updateProgress: async (userId, lessonId) => {
        const response = await fetch(`${API_URL}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, lessonId }),
        });
        return handleResponse(response);
    },

    addCourse: async (courseData) => {
        const response = await fetch(`${API_URL}/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseData),
        });
        return handleResponse(response);
    },

    updateCourse: async (courseId, courseData) => {
        const response = await fetch(`${API_URL}/courses/${courseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseData),
        });
        return handleResponse(response);
    },

    getTeacherCourses: async (teacherId) => {
        const response = await fetch(`${API_URL}/teacher/courses/${teacherId}`);
        return handleResponse(response);
    },

    deleteCourse: async (courseId) => {
        const url = `${API_URL}/courses/${courseId}`;
        const response = await fetch(url, {
            method: 'DELETE',
        });
        return handleResponse(response);
    },

    purchaseCourse: async (purchaseData) => {
        const response = await fetch(`${API_URL}/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(purchaseData),
        });
        return handleResponse(response);
    },

    analyzeUrl: async (url) => {
        const response = await fetch(`${API_URL}/analyze-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });
        return handleResponse(response);
    }
};
