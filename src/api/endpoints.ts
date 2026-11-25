import { apiRequest } from './client';
import type {
  AppNotification,
  AuthSession,
  BrandingConfig,
  ChatMessage,
  CommentItem,
  CommunityPost,
  Conversation,
  DiscoveryFeedResponse,
  ListingDetail,
  OtherUserProfile,
  SharePreview,
  UserProfile,
} from '../types/api';

export const authApi = {
  verifyToken: (idToken: string, provider: 'GOOGLE' | 'PHONE') =>
    apiRequest<AuthSession>('/api/v1/auth/verify-token', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ idToken, provider }),
    }),
};

export const brandingApi = {
  get: () =>
    apiRequest<BrandingConfig>('/api/v1/branding', { auth: false }),
};

export const shareApi = {
  roomPreview: (id: string) =>
    apiRequest<SharePreview>(`/share/api/room/${id}`, { auth: false }),
  postPreview: (id: string) =>
    apiRequest<SharePreview>(`/share/api/post/${id}`, { auth: false }),
};

export const userApi = {
  getMe: () => apiRequest<UserProfile>('/api/v1/users/me'),
  updateDemographics: (payload: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    occupationCategory: string;
    occupationTitle?: string;
    bio?: string;
    avatarUrl?: string;
  }) =>
    apiRequest<unknown>('/api/v1/users/me/demographics', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateLifestyle: (payload: {
    smokingHabit?: string;
    dietaryPreference?: string;
    sleepSchedule?: string;
    cleanlinessLevel?: string;
    guestTolerance?: string;
  }) =>
    apiRequest<UserProfile>('/api/v1/users/me/lifestyle', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateLocation: (latitude: number, longitude: number, localityName?: string) =>
    apiRequest<void>('/api/v1/users/me/location', {
      method: 'PUT',
      body: JSON.stringify({ latitude, longitude, localityName }),
    }),
  updateRoomSeeker: (payload: {
    isRoomSeeker?: boolean;
    roomFinderGender?: string;
    roomFinderGoal?: string;
  }) =>
    apiRequest<UserProfile>('/api/v1/users/me/room-seeker', {
      method: 'PATCH',
      body: JSON.stringify({
        ...(payload.isRoomSeeker !== undefined
          ? { is_room_seeker: payload.isRoomSeeker }
          : {}),
        ...(payload.roomFinderGender !== undefined
          ? { room_finder_gender: payload.roomFinderGender }
          : {}),
        ...(payload.roomFinderGoal !== undefined
          ? { room_finder_goal: payload.roomFinderGoal }
          : {}),
      }),
    }),
  getOtherUser: (id: string) =>
    apiRequest<OtherUserProfile>(`/api/v1/users/${id}`),
  cancelDeletion: () =>
    apiRequest<void>('/api/v1/users/me/cancel-deletion', { method: 'POST' }),
  deleteAccount: () =>
    apiRequest<void>('/api/v1/users/me', { method: 'DELETE' }),
  getSearchPreferences: () =>
    apiRequest<{
      latitude: number;
      longitude: number;
      locality: string;
      searchRadiusKm: number;
      hasTarget?: boolean;
    }>('/api/v1/users/me/search-preferences'),
  updateSearchPreferences: (payload: {
    latitude: number;
    longitude: number;
    locality: string;
    searchRadiusKm: number;
  }) =>
    apiRequest<{
      latitude: number;
      longitude: number;
      locality: string;
      searchRadiusKm: number;
    }>('/api/v1/users/me/search-preferences', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};

export interface DiscoveryParams {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  gender?: string;
  minRent?: number;
  maxRent?: number;
  listingType?: string;
  roomType?: string;
  furnishingStatus?: string;
  sortBy?: string;
  page?: number;
  size?: number;
}

export const discoveryApi = {
  getFeed: (params: DiscoveryParams = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        qs.set(k, String(v));
      }
    });
    return apiRequest<DiscoveryFeedResponse>(`/api/v1/discovery?${qs.toString()}`);
  },
};

export const listingApi = {
  getById: (id: string) =>
    apiRequest<ListingDetail>(`/api/v1/listings/${id}`),
  getMy: () => apiRequest<ListingDetail[]>('/api/v1/listings/my'),
  getLiked: () => apiRequest<ListingDetail[]>('/api/v1/listings/liked'),
  create: (payload: Record<string, unknown>) =>
    apiRequest<ListingDetail>('/api/v1/listings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: Record<string, unknown>) =>
    apiRequest<ListingDetail>(`/api/v1/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    apiRequest<void>(`/api/v1/listings/${id}`, { method: 'DELETE' }),
  toggleLike: (id: string) =>
    apiRequest<{ liked: boolean; likesCount?: number }>(
      `/api/v1/listings/${id}/like`,
      { method: 'POST' }
    ),
  getComments: (id: string) =>
    apiRequest<{ content?: CommentItem[] } | CommentItem[]>(
      `/api/v1/listings/${id}/comments`
    ),
  addComment: (id: string, content: string, parentCommentId?: string) =>
    apiRequest<CommentItem>(`/api/v1/listings/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentCommentId }),
    }),
  deleteComment: (commentId: string) =>
    apiRequest<void>(`/api/v1/listings/comments/${commentId}`, {
      method: 'DELETE',
    }),
  toggleCommentLike: (commentId: string) =>
    apiRequest<void>(`/api/v1/listings/comments/${commentId}/like`, {
      method: 'POST',
    }),
};

export const communityApi = {
  getPosts: (params: {
    lat?: number;
    lng?: number;
    radiusKm?: number;
    category?: string;
    page?: number;
    size?: number;
  } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
        qs.set(k, String(v));
      }
    });
    return apiRequest<{ content: CommunityPost[]; last: boolean }>(
      `/api/v1/community/posts?${qs.toString()}`
    );
  },
  getPost: (id: string) =>
    apiRequest<CommunityPost>(`/api/v1/community/posts/${id}`),
  createPost: (payload: Record<string, unknown>) =>
    apiRequest<CommunityPost>('/api/v1/community/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deletePost: (id: string) =>
    apiRequest<void>(`/api/v1/community/posts/${id}`, { method: 'DELETE' }),
  toggleLike: (id: string) =>
    apiRequest<{ liked: boolean; likesCount: number }>(
      `/api/v1/community/posts/${id}/like`,
      { method: 'POST' }
    ),
  getComments: (id: string) =>
    apiRequest<{ content?: CommentItem[] } | CommentItem[]>(
      `/api/v1/community/posts/${id}/comments`
    ),
  addComment: (id: string, content: string, parentCommentId?: string) =>
    apiRequest<CommentItem>(`/api/v1/community/posts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentCommentId }),
    }),
  deleteComment: (commentId: string) =>
    apiRequest<void>(`/api/v1/community/comments/${commentId}`, {
      method: 'DELETE',
    }),
  toggleCommentLike: (commentId: string) =>
    apiRequest<void>(`/api/v1/community/comments/${commentId}/like`, {
      method: 'POST',
    }),
};

export const chatApi = {
  getConversations: () =>
    apiRequest<Conversation[]>('/api/v1/chat/conversations'),
  getConversation: (id: string) =>
    apiRequest<Conversation>(`/api/v1/chat/conversations/${id}`),
  startOrGetConversation: (recipientId: string, listingId?: string) =>
    apiRequest<Conversation>('/api/v1/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ recipientId, listingId }),
    }),
  acceptConversation: (id: string) =>
    apiRequest<Conversation>(`/api/v1/chat/conversations/${id}/accept`, {
      method: 'POST',
    }),
  rejectConversation: (id: string) =>
    apiRequest<void>(`/api/v1/chat/conversations/${id}/reject`, {
      method: 'POST',
    }),
  getMessages: (id: string, page = 0, size = 40) =>
    apiRequest<{ content: ChatMessage[]; last: boolean } | ChatMessage[]>(
      `/api/v1/chat/conversations/${id}/messages?page=${page}&size=${size}`
    ),
  sendMessage: (
    id: string,
    content: string,
    messageType: 'TEXT' | 'IMAGE' | 'GIF' = 'TEXT',
    attachmentUrls?: string[]
  ) =>
    apiRequest<ChatMessage>(`/api/v1/chat/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, messageType, attachmentUrls }),
    }),
  markRead: (id: string) =>
    apiRequest<void>(`/api/v1/chat/conversations/${id}/read`, {
      method: 'PATCH',
    }),
};

export const notificationsApi = {
  list: () =>
    apiRequest<{ content?: AppNotification[] } | AppNotification[]>(
      '/api/v1/notifications'
    ),
  unreadCount: () =>
    apiRequest<{ count: number }>('/api/v1/notifications/unread-count'),
  markRead: (id: string) =>
    apiRequest<void>(`/api/v1/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () =>
    apiRequest<void>('/api/v1/notifications/read-all', { method: 'PATCH' }),
};

export const uploadApi = {
  uploadProfilePhoto: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file, file.name || 'avatar.jpg');
    const res = await apiRequest<{ url?: string }>(
      '/api/v1/uploads/profile-photo',
      { method: 'POST', body: form }
    );
    return res.url || '';
  },
  uploadListingPhotos: async (files: File[]): Promise<string[]> => {
    const form = new FormData();
    files.forEach((file, idx) => {
      form.append('files', file, file.name || `photo_${idx}.jpg`);
    });
    const res = await apiRequest<{ urls?: string[] }>(
      '/api/v1/uploads/listing-photos',
      { method: 'POST', body: form }
    );
    return res.urls || [];
  },
};
