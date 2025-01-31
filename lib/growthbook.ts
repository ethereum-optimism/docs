// lib/growthbook.ts
import { GrowthBook } from '@growthbook/growthbook-react';

if (!process.env.NEXT_PUBLIC_GROWTHBOOK_API_HOST || !process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY) {
  throw new Error('NEXT_PUBLIC_GROWTHBOOK_API_HOST and NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY must be set');
}

export const growthbook = new GrowthBook({
  apiHost: process.env.NEXT_PUBLIC_GROWTHBOOK_API_HOST,
  clientKey: process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY
});

try {
  growthbook.init();
} catch (error) {
  console.error('Error initializing GrowthBook', error);
}
