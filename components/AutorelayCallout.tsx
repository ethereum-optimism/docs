/**
 * The AutorelayCallout function renders a callout component with a message about autorelays
 * 
 * @param {Props} props - Expected to be empty, ignored.
 * @returns {ReactElement} The AutorelayCallout component, a callout that explains about autorelays.
 */
import type { ReactElement } from 'react';
import { useState } from 'react';

interface Props {
  context?: string;
}
export function AutorelayCallout({ context }: Props): ReactElement {
  return (
    <div
      className="custom-callouts nx-w-full nx-mt-6 nx-flex nx-justify-center nx-items-center nx-bg-white dark:nx-bg-black"
    >
      <div className="nx-w-full  nx-px-4 nx-text-center nx-font-medium nx-text-sm nx-text-left">
          <div className="nx-text-left">
            Normally we expect Superchain blockchains to run an autorelayer and relay your messages automatically.
            However, for performance reasons or reliability, you might decide to subnmit the executing message manually.
            This section shows how to do that.
          </div>
      </div>
    </div>
  );
}