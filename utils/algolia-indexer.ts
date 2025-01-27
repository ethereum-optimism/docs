import fs from 'fs/promises';
import matter from 'gray-matter';
import algoliasearch, { SearchIndex } from 'algoliasearch';
const globby = require("globby");

interface PageObject {
  objectID?: string;
  slug: string;
  section: string;
  content: string;
  [key: string]: unknown;
}

interface AlgoliaConfig {
  appId: string;
  apiKey: string;
  indexName: string;
}

// Configuration
const CONFIG = {
  excludeFiles: [
    '!**.json',
    '!pages/404.mdx',
    '!pages/500.mdx',
    '!pages/_app.mdx'
  ],
  maxContentSize: 9500,
  algolia: {
    appId: process.env.ALGOLIA_APPLICATION_ID || 'JCF9BUJTB9',
    apiKey: process.env.ALGOLIA_WRITE_API_KEY || '71c744716516426a5edfd74347bbc859',
    indexName: process.env.ALGOLIA_INDEX_NAME || 'optimism technical docs'
  } as AlgoliaConfig
};

const sanitizeContent = (content: string, maxBytes: number): string => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8');
  const encoded = encoder.encode(content);
  return decoder.decode(encoded.slice(0, maxBytes));
};

const processPage = async (filePath: string): Promise<PageObject[]> => {
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    const slug = `/${filePath.replace('pages/', '').replace('.mdx', '')}`;

    return content.split(/^(?=#+ )/m)
      .filter(Boolean)
      .map(section => ({
        ...data,
        slug,
        section: slug,
        content: sanitizeContent(section, CONFIG.maxContentSize)
      }));
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return [];
  }
};

class AlgoliaManager {
  private client: ReturnType<typeof algoliasearch>;
  private index: SearchIndex;

  constructor(config: AlgoliaConfig) {
    this.validateConfig(config);
    this.client = algoliasearch(config.appId, config.apiKey);
    this.index = this.client.initIndex(config.indexName);
  }

  private validateConfig(config: AlgoliaConfig): void {
    if (!config.appId || !config.apiKey || !config.indexName) {
      throw new Error('Missing required Algolia configuration');
    }
  }

  async testConnection(): Promise<void> {
    try {
      const indices = await this.client.listIndices();
      console.log('[Algolia] Connection successful. Available indices:', indices);
    } catch (error) {
      console.error('[Algolia] Connection failed:', error);
      throw error;
    }
  }

async updateIndex(objects: PageObject[]): Promise<void> {
  try {
    console.log(`[Algolia] Starting index update with ${objects.length} records`);

    const response = await this.index.replaceAllObjects(objects, {
      safe: true,
      autoGenerateObjectIDIfNotExist: true
    });

    console.log(`[Algolia] Index update initiated. Task IDs:`, response.taskIDs);
    
    await Promise.all(
      response.taskIDs.map(taskID => this.index.waitTask(taskID))
    );
    
    console.log('[Algolia] Index update completed successfully');
  } catch (error) {
    console.error('[Algolia] Index update failed:', error);
    throw error;
  }
}
}

const main = async () => {
  try {

    const pagePaths = await globby(['pages/', ...CONFIG.excludeFiles]);
    console.log(`[Processing] Found ${pagePaths.length} pages to index`);

    const processingResults = await Promise.all(pagePaths.map(processPage));
    const indexObjects = processingResults.flat();

    const algolia = new AlgoliaManager(CONFIG.algolia);
    await algolia.testConnection();
    await algolia.updateIndex(indexObjects);

  } catch (error) {
    console.error('[Main] Fatal error:', error);
    process.exit(1);
  }
};

// Execute
main();