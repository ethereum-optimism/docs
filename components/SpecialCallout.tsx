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
      <div className="nx-w-full  nx-px-4 nx-text-center nx-font-medium nx-text-sm">
        {context ? (
          context
        ) : (
          <div>
            Please do not rely on the content of this page as it is currently
            undergoing maintenance. Code samples and solutions may not function
            as expected. Please check back for an update or{' '}
            <a
              href="https://github.com/ethereum-optimism/docs/labels/tutorial"
              className="callout-link"
            >
              signup to help us revise this page
            </a>
            . We welcome your contribution!
          </div>
        )}
      </div>
    </div>
  );
}
