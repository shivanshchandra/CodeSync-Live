import './App.css';
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';

import Home from './components/Home';
import EditorPage from './components/EditorPage';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';

function App() {
  return (
    <>
      <div>
        <Toaster position='top-center' />
      </div>

      <Routes>
        {/* Auth page (both urls open same page) */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor/:roomId"
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;




// ✅ What this does:

// Without login → user is redirected to /login

// After login → user can access / and /editor/:roomId