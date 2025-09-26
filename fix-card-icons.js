const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Map of keywords to appropriate Mintlify icons
const iconMapping = {
  // Development & Programming
  'solidity': 'code',
  'contract': 'file-contract',
  'code': 'code',
  'programming': 'code',
  'develop': 'code',
  'build': 'hammer',
  'deploy': 'rocket',
  'install': 'download',
  'setup': 'gear',
  'config': 'gear',
  'configure': 'gear',
  
  // Blockchain & Crypto
  'erc20': 'coins',
  'erc-20': 'coins',
  'token': 'coins',
  'ethereum': 'ethereum',
  'eth': 'ethereum',
  'bridge': 'bridge-water',
  'bridging': 'bridge-water',
  'transfer': 'arrow-right-arrow-left',
  'superchain': 'link',
  'chain': 'link',
  'crosschain': 'arrows-exchange',
  'cross-chain': 'arrows-exchange',
  'interop': 'network-wired',
  'message': 'message',
  'transaction': 'exchange-alt',
  'deposit': 'arrow-down',
  'withdrawal': 'arrow-up',
  
  // Tools & CLI
  'cli': 'terminal',
  'command': 'terminal',
  'terminal': 'terminal',
  'vanilla': 'terminal',
  'fork': 'code-branch',
  'reference': 'book',
  'guide': 'book',
  'tutorial': 'graduation-cap',
  'documentation': 'book',
  'docs': 'book',
  
  // Network & Infrastructure
  'network': 'network-wired',
  'rpc': 'server',
  'endpoint': 'server',
  'node': 'server',
  'provider': 'server',
  'connect': 'plug',
  'connection': 'plug',
  
  // Analysis & Monitoring
  'trace': 'route',
  'tracing': 'route',
  'estimate': 'calculator',
  'cost': 'calculator',
  'fee': 'calculator',
  'analytics': 'chart-line',
  'dashboard': 'chart-line',
  'data': 'database',
  'explorer': 'magnifying-glass',
  'monitor': 'eye',
  
  // Development Environment
  'supersim': 'flask',
  'environment': 'flask',
  'simulation': 'flask',
  'test': 'flask',
  'testing': 'flask',
  'devnet': 'flask',
  
  // Getting Started & First Steps
  'getting started': 'rocket',
  'first steps': 'rocket',
  'start': 'rocket',
  'begin': 'rocket',
  'introduction': 'rocket',
  
  // Specific Chain IDs
  'chainid': 'link',
  '901': 'link',
  '902': 'link',
  'opchaina': 'link',
  'opchainb': 'link',
  
  // Tools & Utilities
  'faucet': 'droplet',
  'oracle': 'crystal-ball',
  'nft': 'image',
  'account': 'user',
  'abstraction': 'user',
  'wallet': 'wallet',
  
  // Security & Safety
  'security': 'shield',
  'audit': 'shield',
  'safe': 'shield',
  
  // Operations
  'operation': 'gear',
  'management': 'gear',
  'troubleshoot': 'wrench',
  'debug': 'bug',
  'error': 'triangle-exclamation',
  
  // Communication & Events
  'event': 'calendar',
  'ping pong': 'table-tennis-paddle-ball',
  'contest': 'trophy',
  'tic-tac-toe': 'hashtag',
  
  // Default fallbacks
  'default': 'cube'
};

function findBestIcon(title, description = '') {
  const text = (title + ' ' + description).toLowerCase();
  
  // Check for specific matches first
  for (const [keyword, icon] of Object.entries(iconMapping)) {
    if (text.includes(keyword)) {
      return icon;
    }
  }
  
  // Fallback to default
  return iconMapping.default;
}

// Find all .mdx files
const files = glob.sync('**/*.mdx', {
  ignore: ['node_modules/**', '.next/**']
});

console.log(`Found ${files.length} MDX files to process`);

let processedCount = 0;
let changedCount = 0;

files.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let fileChanged = false;
    
    // Find all Card components with the generic shapes.svg icon
    const cardPattern = /<Card\s+title="([^"]*)"[^>]*href="([^"]*)"[^>]*icon=\{<img\s+src="\/img\/icons\/shapes\.svg"\s*\/>\}[^>]*\/>/g;
    
    let match;
    while ((match = cardPattern.exec(content)) !== null) {
      const fullMatch = match[0];
      const title = match[1];
      const href = match[2];
      
      // Find the best icon for this card
      const bestIcon = findBestIcon(title);
      
      // Replace the generic icon with the specific one
      const newCard = fullMatch.replace(
        /icon=\{<img\s+src="\/img\/icons\/shapes\.svg"\s*\/>\}/,
        `icon="${bestIcon}"`
      );
      
      newContent = newContent.replace(fullMatch, newCard);
      fileChanged = true;
      
      console.log(`📝 ${filePath}:`);
      console.log(`   "${title}" → ${bestIcon}`);
    }
    
    if (fileChanged) {
      fs.writeFileSync(filePath, newContent);
      changedCount++;
    }
    
    processedCount++;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n✅ Processed ${processedCount} files`);
console.log(`🔧 Modified ${changedCount} files`);
console.log(`\n🎨 Replaced generic shapes.svg icons with meaningful Mintlify standard icons!`);
