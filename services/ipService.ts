import { FALLBACK_IP } from '@/constants/defaults';

const IP_CACHE_DURATION = 60 * 60 * 1000;

interface IPCache {
  ip: string;
  timestamp: number;
}

let ipCache: IPCache | null = null;

export async function getUserIP(): Promise<string> {
  if (ipCache && Date.now() - ipCache.timestamp < IP_CACHE_DURATION) {
    console.log('📦 Using cached IP:', ipCache.ip);
    return ipCache.ip;
  }

  try {
    console.log('🌐 Fetching user IP from external API...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const ip = data.ip;

    if (!ip || typeof ip !== 'string') {
      throw new Error('Invalid IP response');
    }

    ipCache = {
      ip,
      timestamp: Date.now(),
    };

    console.log('✅ IP fetched successfully:', ip);
    return ip;
  } catch (error) {
    console.warn('⚠️ Failed to fetch user IP, using fallback:', error);
    return FALLBACK_IP;
  }
}

export function clearIPCache(): void {
  ipCache = null;
}
