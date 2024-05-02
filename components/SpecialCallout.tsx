/**
 * The SpecialCallout function renders a custom callout component with optional context text for
 * displaying maintenance messages.
 * @param {Props}  - The code snippet you provided is a React component named `SpecialCallout` that
 * renders a special callout message. The component takes an optional prop `context` of type string,
 * which can be used to customize the message displayed in the callout.
 * @returns The SpecialCallout component is being returned, which is a React element representing a
 * custom callout with a message. The message displayed depends on the value of the `context` prop
 * passed to the component. If `context` is provided, it will display the provided context message. If
 * `context` is not provided, it will display a default maintenance message.
 */
import type { ReactElement } from 'react';
interface Props {
  context?: string;
}
export function SpecialCallout({ context }: Props): ReactElement {
  return (
    <div className="custom-callouts nx-w-full nx-mt-6 nx-flex nx-justify-center nx-items-center nx-bg-white dark:nx-bg-black">
      <div className="nx-w-full nx-truncate nx-px-4 nx-text-center nx-font-medium nx-text-sm">
        {context
          ? context
          : 'This page is currently undergoing maintenance, it is possible that certain parts may not function as expected.'}
      </div>
    </div>
  );
}
