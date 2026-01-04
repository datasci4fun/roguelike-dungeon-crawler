import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home, Login, Register, Play, PlayScene, Leaderboard, Ghosts, Profile, Achievements, Spectate, Friends } from './pages';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="play" element={<Play />} />
        <Route path="play-scene" element={<PlayScene />} />
        <Route path="spectate" element={<Spectate />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="ghosts" element={<Ghosts />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:userId" element={<Profile />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="friends" element={<Friends />} />
      </Route>
    </Routes>
  );
}

export default App;
