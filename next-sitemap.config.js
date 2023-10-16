/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: process.env.SITE_URL || 'docs.optimism.io',
    generateRobotsTxt: true, // (optional)
    generateIndexSitemap: true,
    // ...other options
  }