import type { ReactElement } from 'react'
import { Tooltip } from 'react-tooltip'
import { define } from '@/utils/glossary'

export function Reference({ children }): ReactElement {
  const id = Math.random().toString(36).substring(2)
  return (
    <span>
      <a className="tooltip-text" data-tooltip-id={id} data-tooltip-content={define(children)}>{children}</a>
      <Tooltip id={id} opacity={1} style={{ zIndex: 99 }} />
    </span>
  );
}
