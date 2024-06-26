/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://docs.optimism.io/',
  generateRobotsTxt: true, // (optional)
  generateIndexSitemap: true,
  // ...other options
}
