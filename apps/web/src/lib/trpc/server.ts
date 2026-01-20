import { httpBatchLink } from '@trpc/client';

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env['VERCEL_URL']) return `https://${process.env['VERCEL_URL']}`;
  return `http://localhost:${process.env['PORT'] ?? 3000}`;
}

export function getTRPCConfig() {
  return {
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
      }),
    ],
  };
}
