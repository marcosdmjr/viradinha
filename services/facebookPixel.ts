import { Platform } from 'react-native';

let AppEventsLogger: any = null;

if (Platform.OS !== 'web') {
  const fbsdk = require('react-native-fbsdk-next');
  AppEventsLogger = fbsdk.AppEventsLogger;
}

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

class FacebookPixel {
  private isInitialized = false;
  private pixelId = '4342804642618023';

  initialize() {
    if (this.isInitialized) return;

    if (Platform.OS === 'web') {
      this.initializeWebPixel();
    } else if (AppEventsLogger) {
      AppEventsLogger.setUserID('anonymous');
      this.isInitialized = true;
      console.log('Facebook Pixel initialized (Native)');
    }
  }

  private initializeWebPixel() {
    if (typeof window === 'undefined') return;

    const script = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${this.pixelId}');
      fbq('track', 'PageView');
    `;

    const scriptElement = document.createElement('script');
    scriptElement.textContent = script;
    document.head.appendChild(scriptElement);

    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${this.pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);

    this.isInitialized = true;
    console.log('Facebook Pixel initialized (Web)');
  }

  trackPageView(screenName: string) {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'PageView', { screen: screenName });
      }
    } else if (AppEventsLogger) {
      AppEventsLogger.logEvent('PageView', { screen: screenName });
    }
  }

  trackInitiateCheckout(value: number, currency: string = 'BRL') {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          value: value,
          currency: currency,
        });
      }
    } else if (AppEventsLogger) {
      AppEventsLogger.logEvent('InitiateCheckout', {
        _valueToSum: value,
        fb_currency: currency,
      });
    }
  }

  trackPurchase(value: number, currency: string = 'BRL') {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', {
          value: value,
          currency: currency,
        });
      }
    } else if (AppEventsLogger) {
      AppEventsLogger.logPurchase(value, currency);
    }
  }

  trackAddToCart(value: number, currency: string = 'BRL') {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'AddToCart', {
          value: value,
          currency: currency,
        });
      }
    } else if (AppEventsLogger) {
      AppEventsLogger.logEvent('AddToCart', {
        _valueToSum: value,
        fb_currency: currency,
      });
    }
  }

  trackLead() {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead');
      }
    } else if (AppEventsLogger) {
      AppEventsLogger.logEvent('Lead');
    }
  }

  trackCompleteRegistration() {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'CompleteRegistration');
      }
    } else if (AppEventsLogger) {
      AppEventsLogger.logEvent('CompleteRegistration');
    }
  }

  trackCustomEvent(eventName: string, params?: Record<string, any>) {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('trackCustom', eventName, params);
      }
    } else if (AppEventsLogger) {
      if (params) {
        AppEventsLogger.logEvent(eventName, params);
      } else {
        AppEventsLogger.logEvent(eventName);
      }
    }
  }
}

export const facebookPixel = new FacebookPixel();
