import { Platform } from 'react-native';

class FycloakService {
  private campaignId = 901;
  private userId = 64;
  private initialized = false;

  initialize() {
    if (Platform.OS !== 'web' || this.initialized) {
      return;
    }

    try {
      if (typeof window === 'undefined') {
        return;
      }

      (window as any).FYCLOAK_CAMPAIGN_ID = this.campaignId;
      (window as any).FYCLOAK_USER_ID = this.userId;

      const script = document.createElement('script');
      script.src = 'https://cdn.fycloak.com/scripts/advanced-fingerprint.js';
      script.async = true;
      script.onerror = () => {
        console.error('Failed to load Fycloak script');
      };
      document.head.appendChild(script);

      this.initialized = true;
      console.log('Fycloak initialized successfully');
    } catch (error) {
      console.error('Error initializing Fycloak:', error);
    }
  }
}

export const fycloakService = new FycloakService();
