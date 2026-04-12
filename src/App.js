import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SignIn from './screens/auth/SignIn';
import SignUp from './screens/auth/SignUp';
import LogExpense from './screens/app/LogExpense';
import ExpenseList from './screens/app/ExpenseList';
import Dashboard from './screens/app/Dashboard';
import AIInsights from './screens/app/AIInsights';
import { ThemeProvider } from './context/ThemeContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5F2ED', fontFamily: 'Sora, sans-serif', fontSize: 14, color: '#aaa' }}>
      Loading...
    </div>
  );
  return user ? children : <Navigate to="/signin" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/log" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/log" replace />} />
      <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
      <Route path="/log" element={<ProtectedRoute><LogExpense /></ProtectedRoute>} />
      <Route path="/list" element={<ProtectedRoute><ExpenseList /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/insights" element={<ProtectedRoute><AIInsights /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}