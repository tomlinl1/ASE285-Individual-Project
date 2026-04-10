import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { ChatList } from './pages/ChatList';
import { ChatRoom } from './pages/ChatRoom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Prompts } from './pages/Prompts';
import './App.css';

function RequireLogin({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <RequireLogin>
                  <ChatList />
                </RequireLogin>
              }
            />
            <Route
              path="/chat/:id"
              element={
                <RequireLogin>
                  <ChatRoom />
                </RequireLogin>
              }
            />
            <Route
              path="/prompts"
              element={
                <RequireLogin>
                  <Prompts />
                </RequireLogin>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
