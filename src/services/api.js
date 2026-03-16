const API_URL = '/api';

export const authApi = {
    signup: async (userData) => {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Signup failed');
        }
        return data;
    },

    login: async (credentials) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }
        return response.json();
    },

    getCourses: async () => {
        const response = await fetch(`${API_URL}/courses`);
        return response.json();
    },

    getCourseDetails: async (id) => {
        const response = await fetch(`${API_URL}/courses/${id}`);
        return response.json();
    },

    getUserData: async (userId) => {
        const response = await fetch(`${API_URL}/user/${userId}/data`);
        return response.json();
    },

    enroll: async (userId, courseId) => {
        const response = await fetch(`${API_URL}/enroll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, courseId }),
        });
        return response.json();
    },

    updateProgress: async (userId, lessonId) => {
        const response = await fetch(`${API_URL}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, lessonId }),
        });
        return response.json();
    },

    addCourse: async (courseData) => {
        const response = await fetch(`${API_URL}/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add course');
        }
        return response.json();
    },

    updateCourse: async (courseId, courseData) => {
        const response = await fetch(`${API_URL}/courses/${courseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update course');
        }
        return response.json();
    },

    getTeacherCourses: async (teacherId) => {
        const response = await fetch(`${API_URL}/teacher/courses/${teacherId}`);
        return response.json();
    },

    deleteCourse: async (courseId) => {
        const url = `${API_URL}/courses/${courseId}`;
        console.log('DELETE request to:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
        });
        
        console.log('DELETE response status:', response.status);
        
        const text = await response.text();
        console.log('DELETE response text:', text.substring(0, 300));
        
        if (response.status === 404) {
            throw new Error('Course not found');
        }
        
        if (response.status === 500) {
            throw new Error('Server error - check backend console');
        }
        
        if (!response.ok) {
            try {
                const data = JSON.parse(text);
                throw new Error(data.message || 'Delete failed');
            } catch (e) {
                throw new Error('Delete failed: ' + text.substring(0, 100));
            }
        }
        
        try {
            return JSON.parse(text);
        } catch (e) {
            return { success: true };
        }
    },

    purchaseCourse: async (purchaseData) => {
        const response = await fetch(`${API_URL}/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(purchaseData),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Purchase failed');
        }
        return data;
    },

    analyzeUrl: async (url) => {
        try {
            const response = await fetch(`${API_URL}/analyze-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });
            
            const text = await response.text();
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error('Invalid JSON: ' + text.substring(0, 200));
            }
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            return data;
        } catch (err) {
            console.error('analyzeUrl error:', err);
            throw err;
        }
    }
};
