import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home, Login, Register, Play, Features, About, PlayScene, SceneDemo, Leaderboard, Ghosts, Profile, Achievements, Spectate, Friends, Presentation, Roadmap, CodebaseHealth, Changelog, DatabaseExplorer, CacheInspector, AudioJukebox, SystemStatus, ApiPlayground, WebSocketMonitor, BuildInfo, LogViewer, ErrorTracker, PerformanceProfiler, SessionInspector, FeatureFlags } from './pages';
import { FirstPersonDemo } from './pages/FirstPersonDemo';
import { FirstPersonTestPage } from './pages/FirstPersonTestPage';
import { Debug3DPage } from './pages/Debug3DPage';
import { CharacterCreation } from './pages/CharacterCreation';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="features" element={<Features />} />
        <Route path="about" element={<About />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="play" element={<Play />} />
        <Route path="character-creation" element={<CharacterCreation />} />
        <Route path="play-scene" element={<PlayScene />} />
        <Route path="scene-demo" element={<SceneDemo />} />
        <Route path="first-person-demo" element={<FirstPersonDemo />} />
        <Route path="first-person-test" element={<FirstPersonTestPage />} />
        <Route path="debug-3d" element={<Debug3DPage />} />
        <Route path="spectate" element={<Spectate />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="ghosts" element={<Ghosts />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:userId" element={<Profile />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="friends" element={<Friends />} />
        <Route path="presentation" element={<Presentation />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="codebase-health" element={<CodebaseHealth />} />
        <Route path="changelog" element={<Changelog />} />
        <Route path="db-explorer" element={<DatabaseExplorer />} />
        <Route path="cache-inspector" element={<CacheInspector />} />
        <Route path="audio-jukebox" element={<AudioJukebox />} />
        <Route path="system-status" element={<SystemStatus />} />
        <Route path="api-playground" element={<ApiPlayground />} />
        <Route path="ws-monitor" element={<WebSocketMonitor />} />
        <Route path="build-info" element={<BuildInfo />} />
        <Route path="log-viewer" element={<LogViewer />} />
        <Route path="error-tracker" element={<ErrorTracker />} />
        <Route path="profiler" element={<PerformanceProfiler />} />
        <Route path="session-inspector" element={<SessionInspector />} />
        <Route path="feature-flags" element={<FeatureFlags />} />
      </Route>
    </Routes>
  );
}

export default App;
