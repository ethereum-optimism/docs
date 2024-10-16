/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://docs.metall2.com/',
  generateRobotsTxt: true, // (optional)
  generateIndexSitemap: true,
  // ...other options
}
