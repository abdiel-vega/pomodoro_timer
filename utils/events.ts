'use client';

export const EVENTS = {
  PROFILE_UPDATED: 'profile_updated',
};

// Type-safe profile update payload
export interface ProfileUpdatePayload {
  username?: string;
  profile_picture?: string | null;
  id: string;
}

export const dispatchProfileUpdate = (data: ProfileUpdatePayload): void => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent<ProfileUpdatePayload>(
      EVENTS.PROFILE_UPDATED,
      {
        detail: data,
      }
    );
    window.dispatchEvent(event);
  }
};
