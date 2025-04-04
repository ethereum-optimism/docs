import type { Item as NormalItem } from "nextra/normalize-pages";
import type { ReactElement } from "react";
import { useContext, useEffect, useState } from "react";
import { HighlightMatches } from "./highlight-matches";
import { DocSearch } from "./docsearch";
import algoliasearch from "algoliasearch";
import AlgoliaContext from "@/utils/contexts/AlgoliaContext";

// Using environment variables for Algolia configuration
const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || "",
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || ""
);

const index = client.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "docs");

type AlgoliaHits = {
  hits: AlgoliaHit[];
  queryID?: string;
};

export type AlgoliaHit = {
  objectID: string;
  title: string;
  description: string;
  slug: string;
};

export function Search({
  className,
  directories,
}: Readonly<{
  className?: string;
  directories: NormalItem[];
}>): ReactElement {
  // Rest of your code remains the same
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const { queryID, setQueryID } = useContext(AlgoliaContext);

  useEffect(() => {
    async function fetchData() {
      const hits: AlgoliaHits = await index.search(search, {
        clickAnalytics: true,
      });

      setQueryID(hits.queryID);

      const mappedHits = hits?.hits.map((hit) => ({
        id: hit.objectID,
        route: hit.slug,
        children: (
          <>
            <HighlightMatches value={hit.title} match={search} />
            <div className="excerpt nx-mt-1 nx-text-sm nx-leading-[1.35rem] nx-text-gray-600 dark:nx-text-gray-400 contrast-more:dark:nx-text-gray-50">
              <HighlightMatches value={hit.description} match={search} />
            </div>
          </>
        ),
      }));
      setResults(mappedHits);
    }

    fetchData();
  }, [search, directories]);

  return (
    <DocSearch
      value={search}
      onChange={setSearch}
      className={className}
      overlayClassName="nx-w-screen nx-min-h-[100px] nx-max-w-[min(calc(100vw-2rem),calc(100%+20rem))]"
      results={results}
    />
  );
}