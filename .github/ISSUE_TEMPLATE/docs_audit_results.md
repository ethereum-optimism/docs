---
name: Docs audit results
about: Template for a formal technical documentation audits run by OP Labs
title: "[2024 Q4 Audit] [page-path]"
labels: ['docs-audit-2024-Q4', 'op-labs']
---

<!-- this template is intended for internal OP Labs usage -->

## Description of the updates required

<!-- Write a description of the current state of the page. -->

### Acceptance criteria

<!-- Definition of done for the assignee -->

### Resources

<!-- Supporting docs, points of contact, and any additional helpful info -->

### Action items

<!-- The process for working through this issue for example:
1. Read through resources and meet with SME
2. Write the first draft
3. Share draft with SMEs and implement feedback
4. Peer review
5. Final SME review
6. Publish -->

## Github issue label criteria

> Choose the appropriate github issue labels for each page.

<details>

<summary>Priority</summary>

- `p-on-hold`: (Defer) Tasks that are currently not actionable due to various reasons like waiting for external inputs, dependencies, or resource constraints. These are reviewed periodically to decide if they can be moved to a more active status.
- `p-low`: (Nice to do) Tasks that have minimal impact on core operations and no immediate deadlines. These tasks are often more about quality of life improvements rather than essential needs.
- `p-medium`: (Could do) Tasks that need to be done but are less critical than high-priority tasks. These often improve processes or efficiency but can be postponed if necessary without immediate severe repercussions.
- `p-high`: (Should do) Important tasks that contribute significantly to long-term goals but may not have an immediate deadline. Delaying these tasks could have considerable negative effects but are not as immediate as critical tasks.
- `p-critical`: Tasks that have immediate deadlines or significant consequences if not completed on time. These are non-negotiable and often linked to core business functions or legal requirements. 
</details>

<details>

<summary>T-shirt size</summary>

- `s-XS`: (< 1 day) Very simple tasks that require minimal time and effort.
- `s-S`: (few days) Tasks that are straightforward but require a bit more time to complete.
- `s-M`: (1-2 weeks) Tasks that involve a moderate level of complexity and collaboration.
- `s-L`: (several weeks) Complex tasks that require significant time investment and coordination across multiple teams. 
- `s-XL`: (> 1 month) Very large and complex projects that involve extensive planning, execution, and testing. 
</details>

<details>

<summary>Content evaluation</summary>
- `a-delete`: don't need this page 
- `a-duplicate`: some content lives elsewhere 
- `a-minor`: needs small revisions 
- `a-moderate`: needs moderate revisions 
- `a-critical`: needs a lot of work
</details>

## MDX Metadata format

> We will be adding better metadata to the header of each page. 
> If I was actively searching for this page on google and this description was the search result, would I know it's the correct page?
> Parse the component and feature tags to add.

```mdx
---
title: "Your Title Here"
tags: ["tag1", "tag2"]
description: "A short description of the content."
---
```

<details>
<summary>Component tags</summary>

```
op-node
op-geth
op-reth
op-erigon
op-nethermind
batcher
standard-bridge
sequencer
l1-contracts
l2-contracts
precompiles
predeploys
preinstalls
op-proposer
op-challenger
op-gov-token
op-supervisor
op-conductor
fp-contracts
cannon
op-program
asterisk
kona
superchain-registry
supersim
dev-console
opsm
mcp
mcp-l2
deputy-guardian
liveness-guard
dispute-mon
op-beat
op-signer
monitorism
blockspace-charters
op-workbench
kubernetes-infrastructure
devops-tooling
artifacts-packaging
sequencer-in-a-box
devnets
performance-tooling
peer-management-service
proxyd
zdd-service
snapman
security-tools
superchain-ops
op-deployer
```
</details>

<details>
<summary>Engineering tags</summary>

```
eng-platforms
eng-growth
eng-devx
eng-protocol
eng-proofs
eng-evm
eng-security
```
</details>

