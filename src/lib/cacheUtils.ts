/**
 * Utility function to clear all profile-related caches
 * Call this when you update a profile to ensure all components fetch fresh data
 */
export const clearProfileCaches = () => {
  try {
    // Clear specific profile caches
    localStorage.removeItem('navbar_profile_cache');
    localStorage.removeItem('profile_page_cache');
    localStorage.removeItem('settings_profile_cache');
    
    // You can add more cache keys here as needed
    
    console.log('Profile caches cleared');
  } catch (error) {
    console.warn('Error clearing profile caches:', error);
  }
};

/**
 * Utility function to force refresh all profile data in the app
 * Dispatches a custom event that profile hooks listen to
 */
export const dispatchProfileUpdate = (profileData?: any) => {
  try {
    window.dispatchEvent(new CustomEvent('profileUpdated', {
      detail: profileData || {}
    }));
    console.log('Profile update event dispatched');
  } catch (error) {
    console.warn('Error dispatching profile update:', error);
  }
};

/**
 * Utility function to refresh a specific profile
 * Used when you need to update a profile image or other data in real-time
 */
export const refreshProfileInCache = (userId: string, profileData: any) => {
  try {
    clearProfileCaches();
    dispatchProfileUpdate(profileData);
  } catch (error) {
    console.warn('Error refreshing profile in cache:', error);
  }
};
