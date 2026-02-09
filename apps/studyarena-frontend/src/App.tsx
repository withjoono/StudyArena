import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ArenaDetailPage from './pages/ArenaDetailPage';
import CreateArenaPage from './pages/CreateArenaPage';
import JoinArenaPage from './pages/JoinArenaPage';
import { processSSOLogin } from './lib/auth';

function App() {
    const [ssoReady, setSsoReady] = useState(false);

    useEffect(() => {
        processSSOLogin().then((loggedIn) => {
            if (loggedIn) {
                console.log('[SSO] 로그인 성공');
            }
            setSsoReady(true);
        });
    }, []);

    if (!ssoReady) return null;

    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route path="arena/:id" element={<ArenaDetailPage />} />
                <Route path="arena/create" element={<CreateArenaPage />} />
                <Route path="arena/join" element={<JoinArenaPage />} />
            </Route>
        </Routes>
    );
}

export default App;
