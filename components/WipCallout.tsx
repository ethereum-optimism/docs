/**
 * The WipCallout function renders a custom callout component with optional context text for
 * displaying maintenance messages.
 * @param {Props} props - An object containing the optional `context` property, a string used
 *                        to customize the message displayed in the callout.
 * @returns {ReactElement} The WipCallout component, representing a custom callout message.
 */
import type { ReactElement } from 'react';
import { useState } from 'react';

interface Props {
  context?: string;
}
export function WipCallout({ context }: Props): ReactElement {
  const [closeCallout, setCloseCallout] = useState(false);
  return (
    <div
      className={`custom-callouts nx-w-full nx-mt-6 nx-flex nx-justify-center nx-items-center nx-bg-white dark:nx-bg-black ${
        closeCallout && 'nx-hidden'
      }`}
    >
      <div className="nx-w-full  nx-px-4 nx-text-center nx-font-medium nx-text-sm nx-text-left">
        {context ? (
          context
        ) : (
          <div className="nx-text-left">
            Please do not rely on the content of this page as it is currently
            undergoing maintenance. Code samples and solutions may not function
            as expected. Please check back for an update or{' '}
            <a
              href="https://github.com/ethereum-optimism/docs/issues"
              className="callout-link"
            >
              sign up to help us revise this page
            </a>
            . We welcome your contribution! ❤️
          </div>
        )}
      </div>
      <button
        className="callout-close-btn"
        onClick={() => setCloseCallout(true)}
      >
        x
      </button>
    </div>
  );
}

export function InteropCallout({ context }: Props): ReactElement {
  const [closeCallout, setCloseCallout] = useState(false);
  return (
    <div
      className={`custom-callouts nx-w-full nx-mt-6 nx-flex nx-justify-center nx-items-center nx-bg-white dark:nx-bg-black ${
        closeCallout && 'nx-hidden'
      }`}
    >
      <div className="nx-w-full  nx-px-4 nx-text-center nx-font-medium nx-text-sm nx-text-left">
        {context ? (
          context
        ) : (
          <div className="nx-text-left">
            Interop is currently in <strong>active development</strong> and not
            yet ready for production use. The information provided here may
            change frequently. We recommend checking back regularly for the most up-to-date
              information.
          </div>
        )}
      </div>
      <button
        className="callout-close-btn"
        onClick={() => setCloseCallout(true)}
      >
        x
      </button>
    </div>
  );
}

interface BetaCalloutProps extends Props {
  featureName: string;
}

function BetaCallout({ context, featureName }: BetaCalloutProps): ReactElement {
  return (
    <div className="custom-callouts nx-w-full nx-mt-6 nx-flex nx-justify-center nx-items-center nx-bg-white dark:nx-bg-black">
      <div className="nx-w-full nx-px-4 nx-text-center nx-font-medium nx-text-sm nx-text-left">
        {context ? (
          context
        ) : (
          <div className="nx-text-left" role="alert" aria-live="polite">
            The {featureName} feature is currently in <strong>Beta</strong> within
            the MIT-licensed OP Stack. Beta features are built and reviewed by
            the Optimism Collective's core contributors, and provide developers
            with early access to highly requested configurations. These features
            may experience stability issues, and we encourage feedback from our
            early users.
          </div>
        )}
      </div>
    </div>
  );
}

export function AltCallout(props: Props): ReactElement {
  return <BetaCallout {...props} featureName="Alt-DA Mode" />;
}

export function CGTCallout(props: Props): ReactElement {
  return <BetaCallout {...props} featureName="Custom Gas Token" />;
}
