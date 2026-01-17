// API client for bookmark operations

export interface Bookmark {
  id: string;
  user_id: string;
  name: string;
  surah_number: number;
  verse_number: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBookmarkData {
  name: string;
  surah_number: number;
  verse_number: number;
}

export interface UpdateBookmarkData {
  surah_number: number;
  verse_number: number;
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

export async function fetchBookmarks(): Promise<Bookmark[]> {
  const response = await fetch('/api/bookmarks');
  return handleResponse<Bookmark[]>(response);
}

export async function createBookmark(data: CreateBookmarkData): Promise<Bookmark> {
  const response = await fetch('/api/bookmarks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Bookmark>(response);
}

export async function updateBookmark(id: string, data: UpdateBookmarkData): Promise<Bookmark> {
  const response = await fetch(`/api/bookmarks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Bookmark>(response);
}

export async function deleteBookmark(id: string): Promise<void> {
  const response = await fetch(`/api/bookmarks/${id}`, {
    method: 'DELETE',
  });
  await handleResponse<{ success: boolean }>(response);
}

export async function renameBookmark(id: string, name: string): Promise<Bookmark> {
  const response = await fetch(`/api/bookmarks/${id}/rename`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse<Bookmark>(response);
}
