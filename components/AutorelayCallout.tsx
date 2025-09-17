/**
 * The AutorelayCallout function renders a callout component with a message about autorelays
 * 
 * @param {Props} props - Expected to be empty, ignored.
 * @returns {ReactElement} The AutorelayCallout component, a callout that explains about autorelays.
 */
import type { ReactElement } from 'react';
import { Callout } from 'nextra/components'

// nx-w-full nx-flex nx-mt-6
// nx-mt-6 nx-justify-center nx-items-center nx-bg-white dark:nx-bg-black"

// import { Callout } from 'vocs/components'

export function AutorelayCallout(): ReactElement {
  return (
    <Callout>
            Normally we expect Superchain blockchains to run an autorelayer and relay your messages automatically.
            However, for performance reasons or reliability, you might decide to submit the executing message manually.
            See below to learn how to do that.
    </Callout>
  );
}
