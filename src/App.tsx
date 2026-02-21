
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Players } from './pages/Players';
import { PlayerEdit } from './pages/PlayerEdit';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Profile } from './pages/Profile';
import { Teams } from './pages/Teams';
import { Leaderboard } from './pages/Leaderboard';
import { Matches } from './pages/Matches';
import { MatchDetail } from './pages/MatchDetail';
import { useAuthStore } from './store/useAuthStore';
import { useStore } from './store/useStore';

export default function App() {
  const { initialize } = useAuthStore();
  const { fetchPlayers, fetchMatches } = useStore();

  useEffect(() => {
    initialize();
    fetchPlayers();
    fetchMatches();
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/players" element={<Players />} />
          <Route path="/players/:id" element={<PlayerEdit />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/matches/:id" element={<MatchDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
