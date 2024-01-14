export const GLOSSARY = {
  'eoa': 'Ethereum term to designate addresses operated by users, as opposed to contract addresses.',
}

export const ALIASES = {
  'eoas': 'eoa',
}

export const define = (term: string): string => {
  const lc = term.toLowerCase()
  const def = GLOSSARY[lc] || GLOSSARY[ALIASES[lc]]
  if (!def) throw new Error(`No definition found for referenced term "${term}"`)
  return def
}
