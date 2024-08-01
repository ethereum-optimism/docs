import fs from "fs";
import matter from "gray-matter";
import algoliasearch from "algoliasearch";

const globby = require("globby");

(async () => {
  const EXCLUDE_FILES = [
    "!**.json",
    "!pages/404.mdx",
    "!pages/500.mdx",
    "!pages/_app.mdx",
  ];

  const pages = await globby(["pages/", ...EXCLUDE_FILES]);

  const objects = pages.map((page: string) => {
    const fileContents = fs.readFileSync(page, "utf8");
    const { data, content } = matter(fileContents);
    const path = page.replace(".mdx", "").replace("pages/", "");
    let slug = path;
    slug = "/" + slug;

    const sections = content.split(/^(?=#+ )/m).filter(Boolean);

    const pageObjects = sections.map((section) => {
      // There's a limit of 10kb on the free plan for each record so this adjustment on the
      // content is for larger sections that go beyond this value including slug, title, etc.
      // Ideally this would be further broken down or the plan increased.
      let encoder = new TextEncoder();
      let decoder = new TextDecoder("utf-8");
      let uint8 = encoder.encode(section);
      let slicedSection = uint8.slice(0, 9500);
      let sectionSized = decoder.decode(slicedSection);

      return {
        ...data,
        section: slug,
        slug,
        content: sectionSized,
      };
    });

    return pageObjects;
  });

  const flattenedObjects = objects.flat(Infinity);

  const client = algoliasearch(
    process.env.ALGOLIA_APPLICATION_ID ?? "",
    process.env.ALGOLIA_WRITE_API_KEY ?? ""
  );

  const index = client.initIndex(process.env.ALGOLIA_INDEX_NAME ?? "");

  console.log("Uploading index...");

  try {
    await index.replaceAllObjects(flattenedObjects, {
      safe: true,
      autoGenerateObjectIDIfNotExist: true,
    });

    console.log("Indexing completed!");
  } catch (e) {
    console.log("Error uploading index", e);
  }
})();
