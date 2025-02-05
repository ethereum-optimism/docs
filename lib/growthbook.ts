// lib/growthbook.ts
import { GrowthBook } from '@growthbook/growthbook-react';

export const growthbook = new GrowthBook({
  apiHost: process.env.NEXT_PUBLIC_GROWTHBOOK_API_HOST || '',
  clientKey: process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY || ''
});

if (process.env.NEXT_PUBLIC_GROWTHBOOK_API_HOST && process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY) {
  growthbook.init();
}
