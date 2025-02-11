// components/GrowthBookProvider.tsx
import { GrowthBookProvider } from '@growthbook/growthbook-react';
import { growthbook } from '../lib/growthbook';

export function CustomGrowthBookProvider({ children }: { children: React.ReactNode }) {
  return <GrowthBookProvider growthbook={growthbook}>{children}</GrowthBookProvider>;
}
