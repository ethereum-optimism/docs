import fs from "fs";
import matter from "gray-matter";

const globby = require("globby");

(async () => {
  const pages = await globby([
    "pages/",
    "!**.json",
    "!pages/404.mdx",
    "!pages/500.mdx",
    "!pages/_app.mdx",
  ]);

  const objects = pages.map((page: any) => {
    const fileContents = fs.readFileSync(page, "utf8");
    const { data, content } = matter(fileContents);
    const path = page.replace(".mdx", "").replace("pages/", "");
    let slug = path;
    slug = "/" + slug;

    const sections = content.split(/^(?=#+ )/m).filter(Boolean);

    const pageObjects = sections.map((section) => {
      return {
        ...data,
        section: slug,
        slug,
        content: section,
      };
    });

    return pageObjects;
  });

  const flattenedObjects = objects.flat(Infinity);

  fs.writeFile("./algolia.json", JSON.stringify(flattenedObjects), (err) => {
    if (err) {
      console.error(err);
    }
  });
})();
