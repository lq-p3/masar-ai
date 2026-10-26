export interface UserProfileDoc {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  photoURL?: string;
  location?: string;
  currentJobTitle?: string;
  careerTracks?: string[];
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateProfileDTO {
  displayName?: string;
  phoneNumber?: string;
  location?: string;
  currentJobTitle?: string;
  careerTracks?: string[];
  onboardingCompleted?: boolean;
}
