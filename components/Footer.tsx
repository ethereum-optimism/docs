import { Link } from 'nextra-theme-docs';

export function Footer() {
  return (
    <div className={`footer-root lg:flex lg:flex-row-reverse`}>
      <div className={`footer-columns lg:w-3/4`}>
        <section>
          <h3>Policies</h3>
          <ul>
            <li>
              <Link href="https://optimism.io/community-agreement">
                Community Agreement
              </Link>
            </li>
            <li>
              <Link href="https://optimism.io/terms">Terms of Service</Link>
            </li>
            <li>
              <Link href="https://optimism.io/data-privacy-policy">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="https://github.com/ethereum-optimism/docs?tab=coc-ov-file#readme">Code of Conduct</Link>
            </li>
          </ul>
        </section>
        <section>
          <h3>Tools</h3>
          <ul>
            <li>
              <Link href="https://console.optimism.io/faucet?utm_source=docs">Superchain Faucet</Link>
            </li>
            <li>
              <Link href="https://optimistic.grafana.net/public-dashboards/c84a5a9924fe4e14b270a42a8651ceb8?orgId=1&refresh=5m">Gas Tracker</Link>
            </li>
            <li>
              <Link href="https://status.optimism.io/">
                Service Status
              </Link>
            </li>
            <li>
              <Link href="https://github.com/ethereum-optimism/optimism/releases">Changelog</Link>
            </li>
            <li>
              <Link href="https://devnets.optimism.io">Devnets</Link>
            </li>
          </ul>
        </section>
        <section>
          <h3>Resources</h3>
          <ul>
            <li>
              <Link href="https://github.com/ethereum-optimism/developers/discussions">Developer Support</Link>
            </li>
            <li>
              <Link href="https://share.hsforms.com/1yENj8CV9TzGYBASD0JC8_gqoshb">Get Launch Support</Link>
            </li>
            <li>
              <Link href="/connect/resources/glossary">Glossary</Link>
            </li>
            <li>
              <Link href="/connect/contribute/stack-contribute">
                Contribute to the OP Stack
              </Link>
            </li>
            <li>
              <Link href="https://specs.optimism.io/">Protocol Specs</Link>
            </li>
          </ul>
        </section>
        <section>
          <h3>Ecosystem</h3>
          <ul>
            <li>
              <Link href="https://github.com/ethereum-optimism/docs/">
                GitHub ↗
              </Link>
            </li>
            <li>
              <Link href="https://discord.gg/optimism">Discord ↗</Link>
            </li>
            <li>
              <Link href="https://twitter.com/optimism">Twitter ↗</Link>
            </li>
          </ul>
        </section>
      </div>
      <div className="lg:w-1/4">
        © {new Date().getFullYear()} <Link href="/">Optimism Foundation. All rights reserved.</Link>
      </div>
    </div>
  );
}