const API = import.meta.env.VITE_API_URL;

function headers() {
    const token = localStorage.getItem('accessToken');
    return { Authorization: `Bearer ${token}` };
}

function jsonHeaders() {
    return { ...headers(), 'Content-Type': 'application/json' };
}

export const getMyStudyGroups = async () => {
    const res = await fetch(`${API}/study-group`, { headers: headers() });
    return res.json();
};

export const createStudyGroup = async (name: string) => {
    const res = await fetch(`${API}/study-group`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ name }),
    });
    return res.json();
};

export const getStudyGroupDetails = async (id: string) => {
    const res = await fetch(`${API}/study-group/${id}`, { headers: headers() });
    return res.json();
};

export const joinStudyGroup = async (code: string) => {
    const res = await fetch(`${API}/study-group/join`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ code }),
    });
    if (!res.ok) throw new Error('Failed to join');
    return res.json();
};

export const inviteStudyGroup = async (id: string) => {
    const res = await fetch(`${API}/study-group/${id}/invite`, {
        method: 'POST',
        headers: headers(),
    });
    return res.json();
};

export const getGroupLeaderboard = async (id: string, period: string = 'daily') => {
    const res = await fetch(`${API}/study-group/${id}/leaderboard?period=${period}`, {
        headers: headers(),
    });
    return res.json();
};

export const getGroupStatistics = async (id: string, period: string = 'daily') => {
    const res = await fetch(`${API}/study-group/${id}/statistics?period=${period}`, {
        headers: headers(),
    });
    return res.json();
};

export const getGroupComments = async (id: string, date?: string) => {
    const url = new URL(`${API}/study-group/${id}/comments`);
    if (date) url.searchParams.append('date', date);
    const res = await fetch(url.toString(), { headers: headers() });
    return res.json();
};

export const addGroupComment = async (
    id: string,
    targetMemberId: string,
    targetDate: string,
    content: string,
) => {
    const res = await fetch(`${API}/study-group/${id}/comment`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ targetMemberId, targetDate, content }),
    });
    return res.json();
};
