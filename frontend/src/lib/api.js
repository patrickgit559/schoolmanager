import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);
export const getMe = () => api.get('/auth/me');

// Users
export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/auth/register', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Campus
export const getCampuses = () => api.get('/campuses');
export const createCampus = (data) => api.post('/campuses', data);
export const updateCampus = (id, data) => api.put(`/campuses/${id}`, data);
export const deleteCampus = (id) => api.delete(`/campuses/${id}`);

// Academic Years
export const getAcademicYears = () => api.get('/academic-years');
export const createAcademicYear = (data) => api.post('/academic-years', data);
export const updateAcademicYear = (id, data) => api.put(`/academic-years/${id}`, data);
export const deleteAcademicYear = (id) => api.delete(`/academic-years/${id}`);

// Formations
export const getFormations = () => api.get('/formations');
export const createFormation = (data) => api.post('/formations', data);
export const updateFormation = (id, data) => api.put(`/formations/${id}`, data);
export const deleteFormation = (id) => api.delete(`/formations/${id}`);

// Filieres
export const getFilieres = (formationId) => api.get('/filieres', { params: { formation_id: formationId } });
export const createFiliere = (data) => api.post('/filieres', data);
export const updateFiliere = (id, data) => api.put(`/filieres/${id}`, data);
export const deleteFiliere = (id) => api.delete(`/filieres/${id}`);

// Levels
export const getLevels = () => api.get('/levels');
export const createLevel = (data) => api.post('/levels', data);
export const updateLevel = (id, data) => api.put(`/levels/${id}`, data);
export const deleteLevel = (id) => api.delete(`/levels/${id}`);

// Classes
export const getClasses = (params) => api.get('/classes', { params });
export const createClass = (data) => api.post('/classes', data);
export const updateClass = (id, data) => api.put(`/classes/${id}`, data);
export const deleteClass = (id) => api.delete(`/classes/${id}`);

// Subjects
export const getSubjects = (params) => api.get('/subjects', { params });
export const createSubject = (data) => api.post('/subjects', data);
export const updateSubject = (id, data) => api.put(`/subjects/${id}`, data);
export const deleteSubject = (id) => api.delete(`/subjects/${id}`);

// Students
export const getStudents = (params) => api.get('/students', { params });
export const getStudent = (id) => api.get(`/students/${id}`);
export const createStudent = (data) => api.post('/students', data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}`);
export const reenrollStudent = (id, data) => api.post(`/students/${id}/reenroll`, data);

// Professors
export const getProfessors = (params) => api.get('/professors', { params });
export const createProfessor = (data) => api.post('/professors', data);
export const updateProfessor = (id, data) => api.put(`/professors/${id}`, data);
export const deleteProfessor = (id) => api.delete(`/professors/${id}`);

// Professor Hours
export const getProfessorHours = (params) => api.get('/professor-hours', { params });
export const createProfessorHours = (data) => api.post('/professor-hours', data);
export const updateProfessorHours = (id, data) => api.put(`/professor-hours/${id}`, data);
export const deleteProfessorHours = (id) => api.delete(`/professor-hours/${id}`);

// Staff
export const getStaff = (params) => api.get('/staff', { params });
export const createStaff = (data) => api.post('/staff', data);
export const updateStaff = (id, data) => api.put(`/staff/${id}`, data);
export const deleteStaff = (id) => api.delete(`/staff/${id}`);

// Grades
export const getGrades = (params) => api.get('/grades', { params });
export const createGrade = (data) => api.post('/grades', data);
export const updateGrade = (id, data) => api.put(`/grades/${id}`, data);
export const deleteGrade = (id) => api.delete(`/grades/${id}`);

// Transactions
export const getTransactions = (params) => api.get('/transactions', { params });
export const createTransaction = (data) => api.post('/transactions', data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

// Archives
export const getArchives = (params) => api.get('/archives', { params });
export const createArchive = (data) => api.post('/archives', data);

// Student Absences
export const getStudentAbsences = (params) => api.get('/student-absences', { params });
export const createStudentAbsence = (data) => api.post('/student-absences', data);
export const deleteStudentAbsence = (id) => api.delete(`/student-absences/${id}`);

// Dashboard
export const getDashboardStats = (params) => api.get('/dashboard/stats', { params });

export default api;
