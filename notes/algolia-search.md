# Algolia Search

## How to prepare and index information

Indexes for Algolia can be generated and uploaded by running:

`pnpm index:docs`

This will generate the appropriate indexes based on the repo's content and upload them to Algolia.

### Required environment variables for indexing

There are 3 required environment variables to update information on Algolia's index:

```env
ALGOLIA_APPLICATION_ID="XXXXXX"
ALGOLIA_WRITE_API_KEY="XXXXXXXXXX"
ALGOLIA_INDEX_NAME="XXX"
```

### Index definition

Searchable attributes on Algolia should be set to:

- title (ordered)
- description (ordered)
- content (unordered)

Deduplication and Grouping should be set to:

- Distinct: `true`
- Attribute for Distinct: `section`

### Github action

A Github action runs on every merge to the `main` branch that indexes and uploads the information to Algolia automatically.

## Events

There are two events tracked on Algolia:

- Click on a search result
- Conversion event when scrolling to bottom of page after clicking on a search result

These can later be used to make adjustments to the recommendations. More info can be found at [Algolia Events Documentation](https://www.algolia.com/doc/guides/sending-events/concepts/event-types/).
