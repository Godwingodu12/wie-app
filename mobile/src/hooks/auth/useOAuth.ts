import { useState } from 'react';
import { authService } from '../../services/authService';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { MOCK_MODE } from '../../constants/config';

WebBrowser.maybeCompleteAuthSession();

export const useOAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const startOAuth = async (provider: 'google' | 'microsoft' | 'apple') => {
    setLoading(true);
    setError(null);
    try {
      if (MOCK_MODE) {
        console.log(`MOCK: Starting ${provider} OAuth`);
        
        // Open the actual sign-in page to show the user the "Account Picker"
        // Even though we mock the result, this shows the real UI.
        let mockUrl = 'https://accounts.google.com/';
        if (provider === 'microsoft') mockUrl = 'https://login.live.com/';
        if (provider === 'apple') mockUrl = 'https://appleid.apple.com/';
        
        await WebBrowser.openBrowserAsync(mockUrl);
        
        // After they close the browser or return to the app, simulate success
        router.push({
            pathname: '/(public)/OAuthCallback',
            params: { token: 'mock-oauth-token-' + provider }
        });
        return { type: 'cancel' }; // Use cancel to prevent openAuthSessionAsync errors
      }

      let url = '';
      if (provider === 'google') url = await authService.getGoogleAuthUrl();
      else if (provider === 'microsoft') url = await authService.getMicrosoftAuthUrl();
      else if (provider === 'apple') url = await authService.getAppleAuthUrl();

      const result = await WebBrowser.openAuthSessionAsync(url, Linking.createURL('/(public)/OAuthCallback'));
      
      return result;
    } catch (err: any) {
      setError(err.message || 'OAuth failed');
      return { type: 'error' };
    } finally {
      setLoading(false);
    }
  };

  return {
    startOAuth,
    loading,
    error
  };
};
