import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@letsforbook/api';

// Export as explicit type to avoid inference issues
export const trpc: ReturnType<typeof createTRPCReact<AppRouter>> = createTRPCReact<AppRouter>();
