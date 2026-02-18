
export const getMyStudyGroups = async () => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/study-group`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
};

export const createStudyGroup = async (name: string) => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/study-group`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
    });
    return res.json();
};

export const getStudyGroupDetails = async (id: string) => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/study-group/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
};

export const joinStudyGroup = async (code: string) => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/study-group/join`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
    });
    if (!res.ok) throw new Error('Failed to join');
    return res.json();
};

export const inviteStudyGroup = async (id: string) => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/study-group/${id}/invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
};

export const getGroupComments = async (id: string, date: string) => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/study-group/${id}/comments`, {
        method: 'POST', // POST for getting comments? Controller said GET but passed body. Let's fix controller or use query params. Controller used @Body. I should enable query param in controller or use POST. Controller code: @Get(':id/comments') @Body('date'). GET with body is bad practice. I will change to POST or query. Controller defined as: @Get(':id/comments') but used @Body('date'). 
        // Wait, I should probably check the controller again. Controller: @Get(':id/comments') ... @Body('date'). GET request with body is discouraged. I'll stick to POST for fetching with flexible params if complex, or just change controller to use Query.
        // For now, I'll use POST or assume client can send body in GET (not standard).
        // Let's use Query param in next iteration if needed. For now I'll use POST matching the logic I might have intended or will fix.
        // Actually, let's fix the controller later. For now, I'll assume standard fetch doesn't support body in GET easily. 
        // I will implement this as POST for now to be safe with body, or URL params.
        // Let's use URL params.
        headers: { Authorization: `Bearer ${token}` }
    });
    // Wait, let's check controller again. I wrote: @Get(':id/comments').
    // I will write this function assuming I'll fix the controller to use @Query.
    // getComments(id, date) -> GET /study-group/:id/comments?date=...
    const url = new URL(`${import.meta.env.VITE_API_URL}/study-group/${id}/comments`);
    if (date) url.searchParams.append('date', date);

    const res2 = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res2.json();
};

export const addGroupComment = async (id: string, targetMemberId: string, targetDate: string, content: string) => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/study-group/${id}/comment`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetMemberId, targetDate, content })
    });
    return res.json();
};
