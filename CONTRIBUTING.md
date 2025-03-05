# Contributing to Optimism Docs

Thanks for taking the time to contribute! ❤️

## Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
  - [File Architecture](#file-architecture)
  - [Content Guidelines](#content-guidelines)
  - [Local Testing](#local-testing)
- [Pull Request Process](#pull-request-process)
  - [Before Submitting](#before-submitting)
  - [Submission Guidelines](#submission-guidelines)
  - [Review Process](#review-process)
- [Code of Conduct](#code-of-conduct)
- [Additional Ways to Contribute](#additional-ways-to-contribute) 

## Overview

Optimism's documentation is open-source and hosted on GitHub in the `ethereum-optimism/docs` repository. The documentation is rendered at [docs.optimism.io](https://docs.optimism.io). You can contribute either by:
- Forking the `docs` repository and working locally
- Using the "Edit this page" button on any documentation page for smaller updates

All contributions, pull requests, and issues should be in English at this time. We will be running a dedicated project in the future to add language support to the technical docs, so please reach out via our [developer support channel](https://github.com/ethereum-optimism/developers/) if you are interested in helping with that project.

## Getting Started

### Prerequisites
- Basic knowledge of Git and GitHub
- Familiarity with Markdown
- Understanding of technical documentation principles
- Node.js and npm installed

### Development Setup
1. Install [pnpm](https://pnpm.io/installation)
2. Run `pnpm i` to install dependencies
3. Run `pnpm dev` to start development server
4. Visit [localhost:3000](http://localhost:3000)

You can now start changing content and see the website updated live each time you save a new file. 🤓

## Contributing Process

### File Architecture
Our documentation is organized into two main sections:

| Section | Purpose | Location |
|---------|----------|----------|
| Pages | Technical documentation content | `/docs/pages/` |
| Public | Images, icons, and illustrations | `/docs/public/` |

**Warning**: The `public` folder contains `robots.txt` and `sitemap.xml` for SEO purposes. These files are maintained by the Documentation team only.

### Content Guidelines
We use [Nextra](https://nextra.site/docs), a React and MDX-based framework with the docs theme (as opposed to the blog theme). The content you write is [Markdown](https://daringfireball.net/projects/markdown/syntax) that accepts [React](https://reactjs.org/) components.

Please refer to our comprehensive [Style Guide](/pages/connect/contribute/style-guide.mdx) for detailed formatting instructions.

### Local Testing
Before submitting your changes:
1. Stop or delete the terminal server if it's running
2. Run `pnpm dev` to test builds
3. Execute `pnpm fix` for automatic linting
4. Run `pnpm spellcheck:lint` for spell checking
   - Add new words to the dictionary by appending them to `words.txt`
5. Use `pnpm spellcheck:fix` to update dictionary
6. Try another `pnpm dev` and repeat until no issues are reported ("client" and "server compiled successfully")

If you encounter build issues:
- Check terminal output for error messages
- Verify all links are working
- Ensure proper formatting according to the style guide
- Test locally before pushing changes

## Pull Request Process

### Before Submitting
- Ensure all local tests pass
- Fix any reported issues
- Verify content accuracy
- Test all links and references
- Target the `main` branch (unless otherwise specified)

### Submission Guidelines
1. Create a [new pull request](https://github.com/ethereum-optimism/docs/issues/new/choose)
2. Choose appropriate PR type or use blank template
3. Provide clear title and accurate description
4. Add required labels:
   - `documentation` (required for all PRs)
   - Content-specific: `tutorial`, `faq`, `troubleshooting`
   - Feature-specific: `oracle`, `rpc-provider`, `faucet`, `attestation`
   - Issue-specific: `user feedback`, `bug`
   
> **Note**: If label type is not set, the Documentation team will set or update it for you.

> **Important**: Add `flag:merge-pending-release` label if the PR content should only be released publicly in sync with a product release.

> **Tip**: Use "[Create draft pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)" if your work is still in progress.

### Review Process
1. Assignment to Documentation team member
2. Technical review for accuracy
3. Quality and scope alignment check
4. Minimum 1 reviewer approval required
5. Reviewers will either approve, request changes, or close the pull request with comments
6. Automatic deployment after merge to [docs.optimism.io](https://docs.optimism.io)

## Code of Conduct
- Be respectful and inclusive
- Follow project guidelines
- Provide constructive feedback
- Maintain professional communication
- Report inappropriate behavior

## Additional Ways to Contribute
Even without direct code contributions, you can support us by:
- ⭐ Starring the project
- 🐦 Sharing on social media
- 📝 Mentioning us in your projects
- 🗣️ Spreading the word in your community

Thank you for contributing to Optimism Docs! 🎉
