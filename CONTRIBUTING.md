# Contributing to Optimism Docs

First off, thanks for taking the time to contribute! ❤️

Optimism's documentation is open-source, hosted on GitHub in the `ethereum-optimism/docs` repository which renders on the corresponding official website hosted at [docs.optimism.io](https://docs.optimism.io). This guide will give you an overview of the contribution workflow from opening an issue, creating a PR, reviewing, and merging the PR. Please note that contributions, pull requests, and issues should be written in English at this time. We will be running a dedicated project in the future to add language support to the technical docs, so please tag us below in the appropriate area if you are interested in helping with that project.

The Optimism Documentation team reviews pull requests and either merges, requests changes, or comments and closes the pull request. You can open a documentation pull request by:

- forking the `docs` repository and working locally,
- or, for smaller updates, clicking the `Edit this page` link on the right side of any documentation page to directly edit in GitHub.

Contributing to the Optimism documentation implies 2 steps:

1. Learn how to use [Nextra](#nextra), the tool used to write and generate Optimism's documentation.

2. [Submit a pull request](#pull-requests) for review.

## Nextra

Optimism's documentation is built with the React- and Markdown-based [Nextra](https://nextra.site/docs) framework. We are using the docs theme (as opposed to the blog theme), which has specialized features.

To start contributing to Optimism's documentation using Nextra, you need to understand the [files and branches architecture](#use-the-files-architecture-and-branch-names-conventions-appropriately), and use the proper [syntax to format content](#use-the-proper-formatting-and-syntax). Additionally, if you want to work locally from a repository fork, you should [set up the Nextra project](#working-locally-set-up-the-project) on your machine.

### Use the files architecture and branch names conventions appropriately

Optimism's documentation includes 2 big sections with each section living in a different folder. You should prefix the name of your contribution’s branch with the corresponding section name:

| Section name      | Target content                                                    | Folder                        |
| ------------------| ----------------------------------------------------------------- | ----------------------------- | 
| Pages       | Where all the pages of the technical docs live | `/docs/pages/` |
| Public   | Where all the images, icons, and illustrations for the tech docs live      | `/docs/public/`  | 

ℹ️ In the rare case of a pull request that impacts multiple parts of the repository (for instance pages + public images), please prefix your branch with `repo/`.

### Use the proper formatting and syntax

Nextra is MDX-based, meaning the content you write is [Markdown](https://daringfireball.net/projects/markdown/syntax) that accepts [React](https://reactjs.org/) components.

The Optimism Documentation team has created a complete style guide for you to make the best out of the various options available:

👉 [Optimism Documentation Style Guide](/pages/contribute/style-guide.mdx) 

### Working locally: Set up the project

To set up the Nextra project on your machine, perform the following steps from a terminal instance:

1. Install pnpm [install pnpm](https://pnpm.io/installation).
2. First, run `pnpm i` to install the dependencies.
3. Then, run `pnpm dev` to start the development server and visit localhost:3000.

You can now start changing content and see the website updated live each time you save a new file. 🤓

## Pull requests

***
⚠️ **Important prerequisite: Build the content locally before submitting a pull request 👇**

To prevent building issues upstream, before submitting your pull request, please stop the development server and build the page locally: stop or delete the terminal server if it's running, then run `pnpm dev`.

- If no issues are reported (”client” and “server compiled successfully”), go ahead and submit the pull request. 
- If some issues are reported (e.g., broken links), please use information reported by the terminal to fix issues, then try another `pnpm dev`, and repeat until no issues are reported.

***

Your pull request should usually target the `main` branch, though the Optimism Documentation team might sometimes ask you to target another branch.

To submit your contribution for review:

1. Create a new [pull request on GitHub](https://github.com/ethereum-optimism/docs/issues/new/choose).
2. Select the docs revision or docs request option.
3. Give it a proper title and description.
4. Click the “Create pull request” button to create the pull request effectively.
    
    ✏️ If your pull request is not ready for review yet, choose the “[Create draft pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)” in the dropdown. The Optimism documentation team will review your pull request only when you will mark it as “[Ready for review](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/changing-the-stage-of-a-pull-request)”.
   
4. _(optional — if not set, the Optimism Documentation team will set or update this for you)_:<br/>Add GitHub labels for:
   - the type of updates introduced by the pull request: 
     - `pr: new content` for new features,
     - `pr: updated content` for significant (20+ lines) updates to existing features,
     - or `pr: chore` for smaller improvements (fixes, typos, chore tasks…).
    
**⚠️ Important: Add the `flag: merge pending release` if the Optimism Documentation team should wait before merging the pull request.** Approved pull requests are usually merged immediately into the `main` branch, automatically triggering a deployment on docs.optimism.io. Please use the `flag: merge pending release` label if the pull request content should only be released publicly in sync with a product release.


That’s it! 🥳 Once the pull request is [reviewed and approved](#review-and-management-of-pull-requests), the Optimism Documentation team will merge it, and the content will be live on [docs.optimism.io](http://docs.optimism.io) a few minutes later. 🚀

## Review and management of pull requests

The pull request review process and timeline are based on the availability of the Optimism Documentation team to handle community contributions. The workflow is as follows:

1. The pull request is assigned to a member of the Documentation team.
2. At least 1 member of the Documentation team will review the pull request for:

   - accuracy,
   - quality,
   - alignment with the documentation scope and roadmap.

3. Reviewers will either approve, ask for changes, or reject the pull request.
4. Accepted pull requests will be merged and automatically deployed on [docs.optimism.io](https://docs.optimism.io) a few minutes later. 

## Other ways to support the project
All types of contributions are encouraged and valued. 
And if you like the project, but just don't have time to contribute, that's fine too. There are other easy ways to support the project and show your appreciation, which we would also be very happy about:
- Star the project
- Tweet about it
- Refer this project in your project's readme
- Mention the project at local meetups and tell your friends/colleagues

The community looks forward to your contributions. 🎉