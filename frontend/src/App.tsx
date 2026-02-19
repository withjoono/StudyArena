import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';

import ArenaDetailPage from './pages/ArenaDetailPage';
import CreateArenaPage from './pages/CreateArenaPage';
import JoinArenaPage from './pages/JoinArenaPage';
import TeacherPage from './pages/TeacherPage';
import RankingPage from './pages/RankingPage';
import StudyGroupPage from './pages/StudyGroupPage';
import StudyGroupDetailPage from './pages/StudyGroupDetailPage';
import BattlePage from './pages/BattlePage';
import BattleDetailPage from './pages/BattleDetailPage';
import { processSSOLogin } from './lib/auth';

function App() {
    const [ssoReady, setSsoReady] = useState(false);
    const hasSSOCode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('sso_code');

    useEffect(() => {
        processSSOLogin().then((loggedIn) => {
            if (loggedIn) {
                console.log('[SSO] 로그인 성공');
                // 토큰 저장 후 페이지를 새로고침하여 모든 컴포넌트가 로그인 상태로 렌더링
                setTimeout(() => window.location.reload(), 500);
                return;
            }
            setSsoReady(true);
        });
    }, []);

    if (!ssoReady) {
        if (!hasSSOCode) return null;
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(4px)',
            }}>
                <div style={{
                    fontSize: '2.5rem',
                    marginBottom: '1rem',
                    animation: 'spin 1.2s linear infinite',
                }}>⏳</div>
                <p style={{
                    fontSize: '1.1rem',
                    color: '#374151',
                    fontWeight: 500,
                }}>자동 로그인 중입니다...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route path="arena/:id" element={<ArenaDetailPage />} />
                <Route path="arena/create" element={<CreateArenaPage />} />
                <Route path="arena/join" element={<JoinArenaPage />} />
                <Route path="arena/:id/teacher" element={<TeacherPage />} />
                <Route path="ranking" element={<RankingPage />} />
                <Route path="study-group" element={<StudyGroupPage />} />
                <Route path="study-group/:id" element={<StudyGroupDetailPage />} />
                <Route path="battle" element={<BattlePage />} />
                <Route path="battle/:code" element={<BattleDetailPage />} />
            </Route>
        </Routes>
    );
}

export default App;
