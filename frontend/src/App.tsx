import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import PromoPage from './pages/PromoPage';
import ArenaDetailPage from './pages/ArenaDetailPage';
import CreateArenaPage from './pages/CreateArenaPage';
import JoinArenaPage from './pages/JoinArenaPage';
import TeacherPage from './pages/TeacherPage';
import RankingPage from './pages/RankingPage';
import StudyGroupPage from './pages/StudyGroupPage';
import StudyGroupDetailPage from './pages/StudyGroupDetailPage';
import { processSSOLogin } from './lib/auth';
import { useAuthStore } from './stores';

function App() {
    const [ssoReady, setSsoReady] = useState(false);
    const { isLoggedIn } = useAuthStore();

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

    if (!ssoReady) return null;

    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={isLoggedIn ? <DashboardPage /> : <PromoPage />} />
                <Route path="arena/:id" element={<ArenaDetailPage />} />
                <Route path="arena/create" element={<CreateArenaPage />} />
                <Route path="arena/join" element={<JoinArenaPage />} />
                <Route path="arena/:id/teacher" element={<TeacherPage />} />
                <Route path="ranking" element={<RankingPage />} />
                <Route path="study-group" element={<StudyGroupPage />} />
                <Route path="study-group/:id" element={<StudyGroupDetailPage />} />
            </Route>
        </Routes>
    );
}

export default App;
