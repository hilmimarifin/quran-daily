// API client for profile operations

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface UpdateProfileData {
  displayName: string;
  avatarUrl?: string;
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

export async function fetchProfile(): Promise<Profile | null> {
  const response = await fetch('/api/profile');
  return handleResponse<Profile | null>(response);
}

export async function updateProfile(data: UpdateProfileData): Promise<Profile> {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Profile>(response);
}
