import { useRouter as useExpoRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

export function useRouterWithUTM() {
  const router = useExpoRouter();
  const { urlTracking } = useAuth();

  const wrappedRouter = useMemo(() => {
    const addUTMParams = (params?: Record<string, any>) => {
      if (!urlTracking?.params) return params;

      return {
        ...params,
        ...urlTracking.params,
      };
    };

    return {
      ...router,
      push: (href: any, options?: any) => {
        if (typeof href === 'string') {
          const utmParams = urlTracking?.params || {};
          const queryString = Object.entries(utmParams)
            .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
            .join('&');

          const separator = href.includes('?') ? '&' : '?';
          const finalHref = queryString ? `${href}${separator}${queryString}` : href;

          console.log('Navegando com UTMs:', { original: href, final: finalHref, utms: utmParams });
          return router.push(finalHref, options);
        }

        if (typeof href === 'object' && href.pathname) {
          const finalHref = {
            ...href,
            params: addUTMParams(href.params),
          };

          console.log('Navegando com UTMs (objeto):', { original: href, final: finalHref });
          return router.push(finalHref as any, options);
        }

        return router.push(href, options);
      },

      replace: (href: any, options?: any) => {
        if (typeof href === 'string') {
          const utmParams = urlTracking?.params || {};
          const queryString = Object.entries(utmParams)
            .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
            .join('&');

          const separator = href.includes('?') ? '&' : '?';
          const finalHref = queryString ? `${href}${separator}${queryString}` : href;

          console.log('Substituindo com UTMs:', { original: href, final: finalHref, utms: utmParams });
          return router.replace(finalHref, options);
        }

        if (typeof href === 'object' && href.pathname) {
          const finalHref = {
            ...href,
            params: addUTMParams(href.params),
          };

          console.log('Substituindo com UTMs (objeto):', { original: href, final: finalHref });
          return router.replace(finalHref as any, options);
        }

        return router.replace(href, options);
      },
    };
  }, [router, urlTracking]);

  return wrappedRouter;
}
