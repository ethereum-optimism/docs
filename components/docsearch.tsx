import { useRef, useEffect } from 'react'

import { DocSearch } from '@docsearch/react';

import '@docsearch/css';

interface KeydownEvent {
    key: string;
    preventDefault: Function;
}

export default function () {
  const input = useRef(null)

  useEffect(() => {
    const inputs = ['input', 'select', 'button', 'textarea']

    const down = (event: KeydownEvent) => {
      if (
        document.activeElement &&
        inputs.indexOf(`${document.activeElement.tagName.toLowerCase() !== "-1"}`)
      ) {
        if (event.key === "/") {
          event.preventDefault()
          input.current?.focus()
        }
      }
    }

    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [])

  return (
    <DocSearch 
      apiKey="88db2b7e75dff6e68ff1f74226546454"
      indexName="optimism"
      appId="P7A16UOSI5"
    />
  )  
}