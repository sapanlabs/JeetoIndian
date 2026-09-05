export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error?.message || `HTTP error ${response.status}`);
  }

  return body.data || body;
}

// Operational API calls
export const getAdminDashboardStats = () => fetchApi('/admin/dashboard');
export const getActiveCompetitions = () => fetchApi('/competitions');
export const createQuestionDraft = (payload: any) => fetchApi('/questions', { method: 'POST', body: JSON.stringify(payload) });
export const createCompetitionDraft = (payload: any) => fetchApi('/competitions', { method: 'POST', body: JSON.stringify(payload) });
export const publishCompetition = (id: string) => fetchApi(`/competitions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'LIVE' }) });
export const getFraudFlags = () => fetchApi('/fraud/flags');
export const getProvisionalWinners = (id: string) => fetchApi(`/winners/competitions/${id}`);
export const confirmWinners = (id: string) => fetchApi(`/winners/competitions/${id}/confirm`, { method: 'POST' });
