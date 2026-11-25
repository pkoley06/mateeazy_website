export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHERS';
export type OccupationCategory =
  | 'STUDENT'
  | 'WORKING_PROFESSIONAL'
  | 'FREELANCER'
  | 'SELF_EMPLOYED'
  | 'OTHER';
export type ListingType = 'HAVE_ROOM' | 'NEED_ROOM';
export type RoomType = 'PRIVATE' | 'SHARE';
export type FurnishingStatus = 'FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED';
export type GenderPreference = 'ALL' | 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';
export type FacilitySharing = 'SHARED' | 'PRIVATE';
export type RoomFinderGoal = 'ROOM' | 'MATE';

export type SmokingHabit = 'NON_SMOKER' | 'OCCASIONAL' | 'REGULAR';
export type DietaryPreference = 'VEG' | 'NON_VEG' | 'EGGETARIAN' | 'VEGAN';
export type SleepSchedule = 'EARLY_BIRD' | 'NIGHT_OWL' | 'FLEXIBLE';
export type CleanlinessLevel = 'NEAT_FREAK' | 'MODERATE' | 'RELAXED';
export type GuestTolerance = 'NO_GUESTS' | 'OCCASIONAL' | 'ANYTIME';

export interface PrefilledUserData {
  fullName?: string;
  email?: string;
  avatarUrl?: string;
}

export interface AuthSession {
  accessToken: string;
  tokenType?: string;
  expiresIn: number;
  userId: string;
  isProfileComplete: boolean;
  pendingDeletion?: boolean;
  scheduledPurgeAt?: string | null;
  preFilledUserData?: PrefilledUserData | null;
}

export interface UserProfile {
  userId: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string;
  age: number;
  avatarUrl?: string | null;
  occupationCategory?: OccupationCategory | null;
  occupationTitle?: string | null;
  bio?: string | null;
  smokingHabit?: SmokingHabit | null;
  dietaryPreference?: DietaryPreference | null;
  sleepSchedule?: SleepSchedule | null;
  cleanlinessLevel?: CleanlinessLevel | null;
  guestTolerance?: GuestTolerance | null;
  profileStrength: number;
  isProfileComplete: boolean;
  missingLifestyleFields: string[];
  isRoomSeeker?: boolean;
  roomFinderGender?: GenderPreference;
  roomFinderGoal?: RoomFinderGoal;
  directFollowEnabled?: boolean;
}

export interface DiscoveryCard {
  listingId?: string | null;
  title?: string | null;
  hostUserId: string;
  hostName: string;
  hostAge: number;
  hostGender: Gender;
  occupationTitle?: string | null;
  avatarUrl?: string | null;
  listingType: ListingType;
  roomType?: RoomType | null;
  furnishingStatus?: FurnishingStatus | null;
  rentAmount?: number | null;
  depositAmount?: number | null;
  localityName: string;
  city?: string | null;
  genderPreference?: GenderPreference;
  distanceKm: number;
  matchPercentage?: number | null;
  compatibilityHighlights: string[];
  photoUrls: string[];
  likedByMe?: boolean | null;
  createdAt?: string | null;
  seekerGoal?: RoomFinderGoal;
}

export interface DiscoveryFeedResponse {
  content: DiscoveryCard[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ListingDetail {
  id: string;
  hostUserId: string;
  status: string;
  listingType: ListingType;
  title?: string | null;
  rentAmount: number;
  depositAmount: number;
  roomType: RoomType;
  furnishingStatus: FurnishingStatus;
  latitude?: number | null;
  longitude?: number | null;
  localityName: string;
  city: string;
  stateName?: string | null;
  postalCode?: string | null;
  description?: string | null;
  photoUrls: string[];
  moveInDate?: string | null;
  amenities: string[];
  houseRules: string[];
  genderPreference: GenderPreference;
  kitchenType?: FacilitySharing | null;
  washroomType?: FacilitySharing | null;
  isAvailable: boolean;
  hostName?: string | null;
  hostAge?: number | null;
  hostAvatarUrl?: string | null;
  hostOccupationTitle?: string | null;
  createdAt?: string | null;
}

export interface OtherUserProfile {
  id: string;
  fullName: string;
  gender: Gender;
  age: number;
  avatarUrl?: string | null;
  occupationCategory?: OccupationCategory | null;
  occupationTitle?: string | null;
  bio?: string | null;
  smokingHabit?: SmokingHabit | null;
  dietaryPreference?: DietaryPreference | null;
  sleepSchedule?: SleepSchedule | null;
  cleanlinessLevel?: CleanlinessLevel | null;
  guestTolerance?: GuestTolerance | null;
  locality?: string | null;
  isRoomSeeker?: boolean;
  roomFinderGoal?: RoomFinderGoal;
  seekingLocality?: string | null;
  seekingRadiusKm?: number | null;
  activeListingsCount: number;
  activeListings: ListingDetail[];
}

export type CommunityPostCategory =
  | 'ALL'
  | 'DISCUSSION'
  | 'RECOMMENDATION'
  | 'MARKETPLACE'
  | 'LOCAL_ALERT'
  | 'EVENT'
  | 'QUESTION';

export interface CommunityPost {
  id: string;
  category: string;
  title: string;
  content: string;
  priceAmount?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  localityName: string;
  city: string;
  distanceKm?: number | null;
  imageUrls: string[];
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
  isPinned: boolean;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  authorIsVerified: boolean;
  authorOccupation?: string | null;
  taggedListingId?: string | null;
  taggedListingTitle?: string | null;
  taggedListingRent?: number | null;
  taggedListingCoverUrl?: string | null;
}

export interface CommentItem {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  content: string;
  createdAt: string;
  likesCount: number;
  isLikedByMe: boolean;
  parentCommentId?: string | null;
  replies?: CommentItem[];
}

export interface ChatParticipant {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  isOnline: boolean;
  lastSeenAt?: string | null;
}

export interface ChatListingSummary {
  id: string;
  title: string;
  rentAmount: number;
  localityName: string;
}

export interface Conversation {
  id: string;
  otherParticipant: ChatParticipant;
  listing?: ChatListingSummary | null;
  requestStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  initiatedByMe: boolean;
  unreadCount: number;
  lastMessage?: {
    content: string;
    sentAt: string;
    status: 'SENT' | 'DELIVERED' | 'READ';
    senderId: string;
    messageType: 'TEXT' | 'IMAGE' | 'GIF';
    attachmentCount?: number;
  } | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  sentAt: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  messageType: 'TEXT' | 'IMAGE' | 'GIF';
  attachmentUrls?: string[];
  replyToMessageId?: string | null;
  replyToContent?: string | null;
  replyToSenderName?: string | null;
  isEdited?: boolean;
  isDeleted?: boolean;
}

export interface SharePreview {
  kind: 'ROOM' | 'POST';
  id: string;
  title: string;
  summary: string;
  imageUrl?: string | null;
}

export interface BrandingConfig {
  communityEnabled: boolean;
  gifsEnabled?: boolean;
  googleMapsApiKey?: string | null;
  privacyPolicyUrl?: string | null;
  termsOfServiceUrl?: string | null;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  referenceId?: string | null;
  actorAvatarUrl?: string | null;
}
