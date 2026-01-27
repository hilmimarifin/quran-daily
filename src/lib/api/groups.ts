// API client for group operations

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface Member {
  id: string;
  user_id: string;
  role: string;
  current_bookmark_id: string | null;
  progress: number;
  bookmark: {
    id: string;
    name: string;
    surah_number: number;
    verse_number: number;
  } | null;
  profile: Profile | null;
}

export interface Group {
  id: string;
  name: string;
  role: string;
  memberCount: number;
}

export interface GroupDetails {
  id: string;
  name: string;
  members: Member[];
  currentUserRole: string;
  currentUserId: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(error.error || 'Request failed', response.status);
  }
  return response.json();
}

export async function fetchGroups(): Promise<Group[]> {
  const response = await fetch('/api/groups');
  return handleResponse<Group[]>(response);
}

export async function fetchGroupDetails(id: string): Promise<GroupDetails> {
  const response = await fetch(`/api/groups/${id}`);
  return handleResponse<GroupDetails>(response);
}

export async function createGroup(name: string): Promise<Group> {
  const response = await fetch('/api/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse<Group>(response);
}

export async function joinGroup(id: string): Promise<void> {
  const response = await fetch(`/api/groups/${id}/join`, {
    method: 'POST',
  });
  await handleResponse(response);
}

export async function leaveGroup(id: string): Promise<void> {
  const response = await fetch(`/api/groups/${id}/leave`, {
    method: 'POST',
  });
  await handleResponse<{ success: boolean }>(response);
}

export async function deleteGroup(id: string): Promise<void> {
  const response = await fetch(`/api/groups/${id}`, {
    method: 'DELETE',
  });
  await handleResponse<{ success: boolean }>(response);
}

export async function setActiveBookmarkForGroup(
  groupId: string,
  bookmarkId: string
): Promise<void> {
  const response = await fetch(`/api/groups/${groupId}/bookmark`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookmarkId }),
  });
  await handleResponse(response);
}

export interface Ranking {
  userId: string;
  rank: number;
  progress: number;
}

export async function fetchGroupRankings(
  groupId: string,
  period: 'weekly' | 'monthly' | 'all' = 'weekly'
): Promise<Ranking[]> {
  const response = await fetch(`/api/groups/${groupId}/rankings?period=${period}`);
  return handleResponse<Ranking[]>(response);
}
