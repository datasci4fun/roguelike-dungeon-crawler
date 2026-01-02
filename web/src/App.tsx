import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home, Login, Register, Play, Leaderboard, Ghosts } from './pages';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="play" element={<Play />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="ghosts" element={<Ghosts />} />
      </Route>
    </Routes>
  );
}

export default App;
