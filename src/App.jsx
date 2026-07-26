import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import EventMaster from './pages/EventMaster';
import EventDetail from './pages/EventDetail';
import AddEvent from './pages/AddEvent';
import Reports from './pages/Reports';
import More from './pages/More';
import Login from './pages/Login';

const SESSION_KEY = 'tep_auth';

function RequireAuth({ children }) {
  const isLoggedIn = sessionStorage.getItem(SESSION_KEY) === 'true';
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="events" element={<EventMaster />} />
          <Route path="events/:id" element={<EventDetail />} />
          <Route path="add" element={<AddEvent />} />
          <Route path="reports" element={<Reports />} />
          <Route path="more" element={<More />} />
        </Route>

        {/* Catch-all → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
