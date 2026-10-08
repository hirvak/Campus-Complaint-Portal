/**
 * Centralized API Service Layer
 * Connects to FastAPI Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('access_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  } catch (err) {
    throw new ApiError('Unable to connect to backend server. Please verify backend is running.', 0);
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    if (data && data.detail) {
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail.map((err) => `${err.loc ? err.loc.join('.') + ': ' : ''}${err.msg}`).join(', ');
      }
    }
    throw new ApiError(errorMessage, response.status, data);
  }

  return data;
}

export const api = {
  // Auth endpoints
  auth: {
    login: async ({ email, password }) => {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      return data;
    },

    googleLogin: async ({ id_token, role, student_type, department }) => {
      const data = await request('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          id_token,
          ...(role ? { role } : {}),
          ...(student_type ? { student_type } : {}),
          ...(department ? { department } : {}),
        }),
      });
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      return data;
    },

    register: async (userData) => {
      const payload = {
        full_name: userData.full_name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        department: userData.department,
        phone: userData.phone || null,
        ...(userData.role === 'Student' ? { student_type: userData.student_type } : {}),
      };

      return await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    logout: () => {
      localStorage.removeItem('access_token');
    },

    getCurrentUser: async () => {
      return await request('/users/me', {
        method: 'GET',
      });
    },
  },

  // Users endpoints
  users: {
    getAll: async () => request('/users/', { method: 'GET' }),
    getById: async (id) => request(`/users/${id}`, { method: 'GET' }),
    createByAdmin: async (userData) =>
      request('/users/', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    updateStatus: async (id, isActive) =>
      request(`/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive }),
      }),
  },

  // Departments endpoints
  departments: {
    getAll: async () => request('/departments/', { method: 'GET' }),
    getById: async (id) => request(`/departments/${id}`, { method: 'GET' }),
    create: async (data) =>
      request('/departments/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: async (id, data) =>
      request(`/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: async (id) => request(`/departments/${id}`, { method: 'DELETE' }),
  },

  // Categories endpoints
  categories: {
    getAll: async () => request('/categories/', { method: 'GET' }),
    getById: async (id) => request(`/categories/${id}`, { method: 'GET' }),
    getByDepartment: async (deptId) => request(`/categories/department/${deptId}`, { method: 'GET' }),
    create: async (data) =>
      request('/categories/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: async (id, data) =>
      request(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: async (id) => request(`/categories/${id}`, { method: 'DELETE' }),
  },

  // Reports endpoints
  reports: {
    getComplete: async () => request('/reports/', { method: 'GET' }),
    getSummary: async () => request('/reports/summary', { method: 'GET' }),
    getStatus: async () => request('/reports/status', { method: 'GET' }),
    getPriority: async () => request('/reports/priority', { method: 'GET' }),
    getCategories: async () => request('/reports/categories', { method: 'GET' }),
    getDepartments: async () => request('/reports/departments', { method: 'GET' }),
    export: async (format = 'csv') => {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/reports/export?format=${format}`, {
        method: 'GET',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to export report (${response.status}).`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `campuscare_report_${format}.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      return { blob, filename };
    },
  },

  // Dashboard endpoints
  dashboard: {
    getStats: async () => request('/dashboard/', { method: 'GET' }),
  },

  // Notifications endpoints
  notifications: {
    getAll: async () => request('/notifications/', { method: 'GET' }),
    getUnread: async () => request('/notifications/unread', { method: 'GET' }),
    markAllAsRead: async () => request('/notifications/read-all', { method: 'PATCH' }),
    markAsRead: async (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  },

  // Complaints endpoints
  complaints: {
    create: async (complaintData) =>
      request('/complaints/', {
        method: 'POST',
        body: JSON.stringify({
          title: complaintData.title,
          description: complaintData.description,
          category_id: Number(complaintData.category_id),
          location: complaintData.location,
          image_url: complaintData.image_url || null,
        }),
      }),

    getMyComplaints: async () => request('/complaints/my', { method: 'GET' }),
    getAssignedComplaints: async () => request('/complaints/assigned', { method: 'GET' }),
    getPendingComplaints: async () => request('/complaints/pending', { method: 'GET' }),
    getAllComplaints: async () => request('/complaints/all', { method: 'GET' }),

    searchComplaints: async ({
      search = '',
      status_filter = '',
      priority = '',
      category_id = '',
      department_id = '',
      page = 1,
      page_size = 10,
    } = {}) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status_filter) params.append('status_filter', status_filter);
      if (priority) params.append('priority', priority);
      if (category_id) params.append('category_id', category_id);
      if (department_id) params.append('department_id', department_id);
      params.append('page', page);
      params.append('page_size', page_size);
      return request(`/complaints/search?${params.toString()}`, { method: 'GET' });
    },

    getById: async (id) => request(`/complaints/${id}`, { method: 'GET' }),
    getHistory: async (id) => request(`/complaints/${id}/history`, { method: 'GET' }),

    assign: async (id, { assigned_to, priority }) =>
      request(`/complaints/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ assigned_to: Number(assigned_to), priority }),
      }),

    updateStatus: async (id, statusVal) =>
      request(`/complaints/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: statusVal }),
      }),

    resolve: async (id, { resolution_remarks, completion_image }) =>
      request(`/complaints/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution_remarks, completion_image: completion_image || null }),
      }),

    close: async (id) => request(`/complaints/${id}/close`, { method: 'POST' }),
    reopen: async (id) => request(`/complaints/${id}/reopen`, { method: 'POST' }),
  },
};
