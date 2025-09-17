import AlgoliaContext from "@/utils/contexts/AlgoliaContext";
import React, { ReactNode, useContext, useEffect } from "react";
import * as aa from "search-insights";

export default function ScrollDispatcher({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { queryID, objectID } = useContext(AlgoliaContext);

  const onScroll = () => {
    const bottom =
      Math.ceil(window.innerHeight + window.scrollY) >=
      document.documentElement.scrollHeight;

    if (bottom && queryID && objectID) {
      aa.default("convertedObjectIDsAfterSearch", {
        index: "docs",
        eventName: "Converted Search",
        queryID: queryID,
        objectIDs: [objectID],
      });
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [queryID, objectID]);

  return <div>{children}</div>;
}
