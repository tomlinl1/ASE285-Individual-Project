import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChatProvider } from './contexts/ChatContext';
import { ChatList } from './pages/ChatList';
import { ChatRoom } from './pages/ChatRoom';
import './App.css';

function App() {
  return (
    <ChatProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ChatList />} />
          <Route path="/chat/:id" element={<ChatRoom />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ChatProvider>
  );
}

export default App;
