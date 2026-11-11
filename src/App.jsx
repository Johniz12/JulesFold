import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import { AuthLayout } from './layouts/AuthLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { StudentLayout } from './layouts/StudentLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCourses } from './pages/admin/AdminCourses';
import { AdminLessons } from './pages/admin/AdminLessons';
import { AdminExams } from './pages/admin/AdminExams';
import { AdminStudents } from './pages/admin/AdminStudents';
import { AdminResults } from './pages/admin/AdminResults';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { CourseLibrary } from './pages/student/CourseLibrary';
import { CourseDetail } from './pages/student/CourseDetail';
import { LessonViewer } from './pages/student/LessonViewer';
import { StudentExams } from './pages/student/StudentExams';
import { ExamRunner } from './pages/student/ExamRunner';
import { ExamResult } from './pages/student/ExamResult';

const RootRedirect = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg"></div>
        <p>Loading LearnHub...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Index Route */}
          <Route path="/" element={<RootRedirect />} />

          {/* Authentication Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Student Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['student', 'admin']} />}>
            <Route element={<StudentLayout />}>
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/courses" element={<CourseLibrary />} />
              <Route path="/courses/:courseId" element={<CourseDetail />} />
              <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonViewer />} />
              <Route path="/exams" element={<StudentExams />} />
              <Route path="/exams/:examId" element={<ExamRunner />} />
              <Route path="/exams/:examId/results/:attemptId" element={<ExamResult />} />
            </Route>
          </Route>

          {/* Administrator Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/courses" element={<AdminCourses />} />
              <Route path="/admin/courses/:courseId/lessons" element={<AdminLessons />} />
              <Route path="/admin/exams" element={<AdminExams />} />
              <Route path="/admin/students" element={<AdminStudents />} />
              <Route path="/admin/results" element={<AdminResults />} />
            </Route>
          </Route>

          {/* 404 Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
