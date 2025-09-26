import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="logo-text">OPTIMISM</span>
            <span className="logo-subtitle">DOCS</span>
          </div>
        </div>
        
        <div className="footer-columns">
          <div className="footer-column">
            <h3 className="footer-heading">Tools</h3>
            <ul className="footer-links">
              <li><a href="https://faucet.quicknode.com/optimism/sepolia" target="_blank" rel="noopener noreferrer">Superchain Faucet</a></li>
              <li><a href="https://gas-tracker.optimism.io/" target="_blank" rel="noopener noreferrer">Gas Tracker</a></li>
              <li><a href="https://status.optimism.io/" target="_blank" rel="noopener noreferrer">Service Status</a></li>
              <li><a href="https://github.com/ethereum-optimism/optimism/releases" target="_blank" rel="noopener noreferrer">Changelog</a></li>
              <li><a href="https://github.com/ethereum-optimism/developers" target="_blank" rel="noopener noreferrer">Devnets</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h3 className="footer-heading">Resources</h3>
            <ul className="footer-links">
              <li><a href="https://github.com/ethereum-optimism/developers" target="_blank" rel="noopener noreferrer">Developer Support</a></li>
              <li><a href="https://discord.gg/optimism" target="_blank" rel="noopener noreferrer">Superchain Dev Discord</a></li>
              <li><a href="https://optimism.io/get-launch-support" target="_blank" rel="noopener noreferrer">Get Launch Support</a></li>
              <li><a href="/connect/resources/glossary">Glossary</a></li>
              <li><a href="/connect/contribute">Contribute to the OP Stack</a></li>
              <li><a href="https://specs.optimism.io/" target="_blank" rel="noopener noreferrer">Protocol Specs</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h3 className="footer-heading">Ecosystem</h3>
            <ul className="footer-links">
              <li><a href="https://github.com/ethereum-optimism/ecosystem" target="_blank" rel="noopener noreferrer">Ecosystem Packages</a></li>
              <li><a href="https://github.com/ethereum-optimism/ecosystem/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Ecosystem Contributions</a></li>
              <li><a href="https://github.com/ethereum-optimism/superchain-registry" target="_blank" rel="noopener noreferrer">Superchain Registry</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h3 className="footer-heading">Follow Us</h3>
            <div className="social-links">
              <a href="https://discord.gg/optimism" target="_blank" rel="noopener noreferrer" className="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
              </a>
              <a href="https://twitter.com/optimism" target="_blank" rel="noopener noreferrer" className="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://github.com/ethereum-optimism" target="_blank" rel="noopener noreferrer" className="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <div className="footer-legal">
            <a href="https://optimism.io/community-agreement" target="_blank" rel="noopener noreferrer">Community Agreement</a>
            <a href="https://optimism.io/terms-of-service" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            <a href="https://optimism.io/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            <a href="https://optimism.io/code-of-conduct" target="_blank" rel="noopener noreferrer">Code of Conduct</a>
          </div>
          <div className="footer-copyright">
            © 2025 Optimism Foundation. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
