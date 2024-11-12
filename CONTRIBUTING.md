# Contributing to Optimism Docs

Thanks for taking the time to contribute! ❤️

Optimism's documentation is open-source, hosted on GitHub in the `ethereum-optimism/docs` repository which renders on the corresponding official website hosted at [docs.optimism.io](https://docs.optimism.io). This guide will give you an overview of the contribution workflow from opening an issue, creating a PR, reviewing, and merging the PR. Please note that contributions, pull requests, and issues should be written in English at this time. We will be running a dedicated project in the future to add language support to the technical docs, so please reach out via our [developer support channel](https://github.com/ethereum-optimism/developers/) if you are interested in helping with that project.

The Optimism Documentation team reviews pull requests and either merges, requests changes, or comments and closes the pull request. You can open a documentation pull request by:

- forking the `docs` repository and working locally,
- or, for smaller updates, clicking the `Edit this page` link on the right side of any documentation page to directly edit in GitHub.

Contributing to the Optimism documentation implies 2 steps:

1. Learn how to use [Nextra](#learn-how-to-use-nextra), the tool used to write and generate Optimism's documentation.

2. [Submit a pull request](#send-pull-request) for review.

## Learn How to Use Nextra

Optimism's documentation is built with the React and Markdown-based [Nextra](https://nextra.site/docs) framework. We are using the docs theme (as opposed to the blog theme), which has specialized features.

To start contributing to Optimism's documentation using Nextra, you need to understand the [files and branches architecture](#understand-file-architecture-and-branch-names) and use the proper [syntax to format content](#use-proper-formatting-and-syntax). Additionally, if you want to work locally from a repository fork, you should [set up the Nextra project](#set-up-the-project-and-test-locally) on your machine.

### Understand File Architecture and Branch Names

Optimism's documentation includes two major sections with each section living in a different folder. 

| Section name      | Target content                                                    | Folder                        |
| ------------------| ----------------------------------------------------------------- | ----------------------------- | 
| Pages       | Where all the pages of the technical docs live | `/docs/pages/` |
| Public   | Where all the images, icons, and illustrations for the tech docs live      | `/docs/public/`  | 

**Warning**
The `public` folder also stores the `robots.txt` and `sitemap.xml` files used for SEO. Please do not modify these pages. 
The Optimism Documentation team will modify these pages, when necessary, after your PR is merged.

### Use Proper Formatting and Syntax

Nextra is MDX-based, meaning the content you write is [Markdown](https://daringfireball.net/projects/markdown/syntax) that accepts [React](https://reactjs.org/) components.

The Optimism Documentation team has created a complete style guide for you to make the best out of the various options available:

[Optimism Documentation Style Guide](/pages/connect/contribute/style-guide.mdx) 

### Set Up the Project and Test Locally

To set up the Nextra project on your machine, perform the following steps from a terminal instance:

1. Install pnpm [install pnpm](https://pnpm.io/installation).
2. First, run `pnpm i` to install the dependencies.
3. Then, run `pnpm dev` to start the development server and 
4. Visit [localhost:3000](http://localhost:3000) in your browser to view the website.

You can now start changing content and see the website updated live each time you save a new file. 🤓

## Send Pull Request

**Important prerequisite**

To prevent building issues upstream, you should build the content locally before submitting a pull request: stop or delete the terminal server if it's running, then run `pnpm dev`.

- Use the information reported by the terminal to fix any issues (e.g., broken links). 
- Run `pnpm fix` to automatically fix most linting issues (e.g., formatting and style guide). 
- Run `pnpm spellcheck:lint` to test your content against the dictionary. Add new words to the dictionary by appending them to `words.txt`.
- Run `pnpm spellcheck:fix` to add new words to the dictionary automatically.
- Try another `pnpm dev` and repeat until no issues are reported ("client" and "server compiled successfully").


Your pull request should usually target the `main` branch, though the Optimism Documentation team might sometimes ask you to target another branch.

To submit your contribution for review:

1. Create a new [pull request on GitHub](https://github.com/ethereum-optimism/docs/issues/new/choose).
2. Select a PR type from the list or choose **Open a blank issue** at the bottom of the page.
3. Complete the form as requested. For blank PR issues, please provide a clear title and accurate description/context.
4. Click the "Create pull request" button to create the pull request effectively.
    
>If your pull request is not ready for review yet, choose the "[Create draft pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)"in the dropdown. The Optimism documentation team will review your pull request only when you mark it as "[Ready for review](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/changing-the-stage-of-a-pull-request)".
   
5. Add GitHub labels for the pull request. Add `documentation` to all pull requests in this repo **AND** additional labels based on the type of update or request.
     - `tutorial`, `faq`, or `troubleshooting` for specific content types, 
     - `oracle`, `rpc-provider`, `faucet`, or `attestation` for ecosystem offerings,
     - `user feedback` for general feedback about one or more pages, or 
     - `bug` if something isn't working as expected. 
>If label for type of update is not set, the Optimism Documentation team will set or update this for you<br/>
    
**Warning**
Approved pull requests are usually merged immediately into the `main` branch, automatically triggering a deployment on docs.optimism.io. Please add the `flag:merge-pending-release` label if the pull request content should only be released publicly in sync with a product release.

That's it! 🥳 Once the pull request is [reviewed and approved](#review-and-management-of-pull-requests), the Optimism Documentation team will merge it, and the content will be live on [docs.optimism.io](http://docs.optimism.io) a few minutes later. 🚀

## Review and Management of Pull Requests

The pull request review process and timeline are based on the availability of the Optimism Documentation team to handle community contributions. The workflow is as follows:

1. The pull request is assigned to a member of the Documentation team.
2. At least 1 member of the Documentation team will review the pull request for:

   - accuracy,
   - quality,
   - alignment with the documentation scope.

3. Reviewers will either approve, ask for changes, or reject the pull request.
4. Accepted pull requests will be merged and automatically deployed on [docs.optimism.io](https://docs.optimism.io) a few minutes later. 

## Other Ways to Support the Project
All types of contributions are encouraged and valued. 
And if you like the project, but just don't have time to contribute, that's fine too. There are other easy ways to support the project and show your appreciation, which we would also be very happy about:
- Star the project
- Tweet about it
- Refer this project in your project's readme
- Mention the project at local meetups and tell your friends/colleagues

The community looks forward to your contributions. 🎉
