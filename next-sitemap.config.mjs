/** @type {import('next-sitemap').IConfig} */
export default {
  siteUrl: process.env.SITE_URL || 'https://snazzy-hamster-4e1647.netlify.app/',
  generateRobotsTxt: true, // (optional)
  generateIndexSitemap: true,
  // ...other options
}
