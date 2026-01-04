import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home, Login, Register, Play, PlayScene, SceneDemo, Leaderboard, Ghosts, Profile, Achievements, Spectate, Friends } from './pages';
import { FirstPersonDemo } from './pages/FirstPersonDemo';
import { CharacterCreation } from './pages/CharacterCreation';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="play" element={<Play />} />
        <Route path="character-creation" element={<CharacterCreation />} />
        <Route path="play-scene" element={<PlayScene />} />
        <Route path="scene-demo" element={<SceneDemo />} />
        <Route path="first-person-demo" element={<FirstPersonDemo />} />
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
