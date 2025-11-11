import { Project, SyntaxKind } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

// Define which components to generate
// Key: Component Name, Value: path to source file
const ACTIONS_COMPONENTS: Record<string, string> = {
  WalletNamespace: "src/wallet/core/namespace/WalletNamespace.ts",
  Wallet: "src/wallet/core/wallets/abstract/Wallet.ts",
  WalletLendNamespace: "src/lend/namespaces/WalletLendNamespace.ts",
};

interface MethodDoc {
  name: string;
  description: string;
  params: Array<{ name: string; type: string; description: string; typeDefinition?: string }>;
  returns: string;
  throws?: string;
  signature: string;
  lineNumber: number;
  sourcePath: string;
}

interface TypeInfo {
  definition: string;
  properties?: Array<{ name: string; type: string; typeDefinition?: string }>;
}

interface PropertyDoc {
  name: string;
  type: string;
  description: string;
}

function getTypeInfo(type: any, project: Project): TypeInfo | null {
  try {
    const typeText = type.getText();

    // Try to find the type definition in the project by searching for type aliases or interfaces
    const cleanTypeName = typeText.split('<')[0].trim(); // Remove generic parameters

    // Search through all source files for the type definition
    for (const sourceFile of project.getSourceFiles()) {
      // Check type aliases
      const typeAlias = sourceFile.getTypeAlias(cleanTypeName);
      if (typeAlias) {
        const typeNode = typeAlias.getTypeNode();
        if (typeNode && typeNode.getKindName() === "TypeLiteral") {
          const definition = typeAlias.getText();
          const properties: Array<{ name: string; type: string; typeDefinition?: string }> = [];

          const members = (typeNode as any).getMembers();
          for (const member of members) {
            if (member.getKindName() === "PropertySignature") {
              const propName = member.getName();
              const propType = member.getType();
              const propTypeText = propType.getText();

              // Get nested type definition (one level deep)
              const nestedTypeInfo = getTypeInfo(propType, project);

              properties.push({
                name: propName,
                type: propTypeText,
                typeDefinition: nestedTypeInfo?.definition,
              });
            }
          }

          return { definition, properties };
        }
      }

      // Check interfaces
      const interfaceDecl = sourceFile.getInterface(cleanTypeName);
      if (interfaceDecl) {
        const definition = interfaceDecl.getText();
        const properties: Array<{ name: string; type: string; typeDefinition?: string }> = [];

        for (const prop of interfaceDecl.getProperties()) {
          const propName = prop.getName();
          const propType = prop.getType();
          const propTypeText = propType.getText();

          // Get nested type definition (one level deep)
          const nestedTypeInfo = getTypeInfo(propType, project);

          properties.push({
            name: propName,
            type: propTypeText,
            typeDefinition: nestedTypeInfo?.definition,
          });
        }

        return { definition, properties };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

function extractMethodDocs(classDeclaration: any, sourcePath: string, project: Project): MethodDoc[] {
  const methods: MethodDoc[] = [];

  for (const method of classDeclaration.getMethods()) {
    // Skip protected and private methods
    const scope = method.getScope();
    if (scope === 'protected' || scope === 'private') continue;

    const jsDoc = method.getJsDocs()[0];
    if (!jsDoc) continue;

    const tags = jsDoc.getTags();
    const description = jsDoc.getDescription().trim();

    const params: Array<{ name: string; type: string; description: string; typeDefinition?: string }> = [];

    // Process @param tags from JSDoc
    const paramTags = tags.filter((tag) => tag.getTagName() === "param");

    // Build a map of parent parameter types for resolving nested properties
    const paramTypeMap = new Map<string, any>();
    for (const param of method.getParameters()) {
      const paramType = param.getType();
      paramTypeMap.set(param.getName(), paramType);

      // Also store type info for this parameter
      const typeInfo = getTypeInfo(paramType, project);
      if (typeInfo) {
        paramTypeMap.set(`${param.getName()}:typeInfo`, typeInfo);
      }
    }

    for (const tag of paramTags) {
      // Get full comment text including multi-line descriptions
      const commentText = tag.getComment();
      const text = typeof commentText === 'string'
        ? commentText
        : Array.isArray(commentText)
          ? commentText.map(part => typeof part === 'string' ? part : part.text).join(' ')
          : "";

      const name = tag.compilerNode.name?.getText() || "";

      // Check if this is a nested parameter (e.g., "params.signer")
      if (name.includes('.')) {
        const parts = name.split('.');
        const baseName = parts[0];
        const propName = parts.slice(1).join('.');

        // Get the type info for the base parameter
        const typeInfo = paramTypeMap.get(`${baseName}:typeInfo`) as TypeInfo | undefined;

        if (typeInfo?.properties) {
          // Find the property in the type definition
          const prop = typeInfo.properties.find(p => p.name === propName);

          if (prop) {
            params.push({
              name,
              type: prop.type,
              description: text.trim(),
              typeDefinition: prop.typeDefinition,
            });
            continue;
          }
        }

        // If we couldn't find type info, add with empty type
        params.push({
          name,
          type: "",
          description: text.trim(),
        });
      } else {
        // Top-level parameter
        const paramType = paramTypeMap.get(name);

        if (!paramType) {
          params.push({
            name,
            type: "",
            description: text.trim(),
          });
          continue;
        }

        const paramTypeText = paramType.getText();
        const typeInfo = paramTypeMap.get(`${name}:typeInfo`) as TypeInfo | undefined;

        params.push({
          name,
          type: paramTypeText,
          description: text.trim(),
          typeDefinition: typeInfo?.definition,
        });
      }
    }

    const returnsTag = tags.find((tag) => tag.getTagName() === "returns");
    const throwsTag = tags.find((tag) => tag.getTagName() === "throws");

    methods.push({
      name: method.getName(),
      description,
      params,
      returns: returnsTag?.getCommentText() || "",
      throws: throwsTag?.getCommentText(),
      signature: method.getText(),
      lineNumber: method.getStartLineNumber(),
      sourcePath,
    });
  }

  return methods;
}

function extractPropertyDocs(classDeclaration: any): PropertyDoc[] {
  const properties: PropertyDoc[] = [];

  for (const property of classDeclaration.getProperties()) {
    // Skip protected and private properties
    const scope = property.getScope();
    if (scope === 'protected' || scope === 'private') continue;

    const jsDoc = property.getJsDocs()[0];
    if (!jsDoc) continue;

    const description = jsDoc.getDescription().trim();
    const type = property.getType().getText();

    properties.push({
      name: property.getName(),
      type,
      description,
    });
  }

  return properties;
}

function generateComponentMDX(className: string, classDescription: string, properties: PropertyDoc[], methods: MethodDoc[], gitRef: string): string {
  let mdx = `{/*
  ⚠️ WARNING: DO NOT EDIT THIS FILE DIRECTLY ⚠️

  This file is auto-generated from the Actions SDK source code.
  Generation script: scripts/generate-actions-components.ts

  To update this documentation:
  1. Bump the SDK version in package.json: pnpm add @eth-optimism/actions-sdk@latest
  2. Run the generation script: pnpm prebuild

  Any manual edits will be overwritten on the next generation.
*/}

## ${className}

`;

  // Add class description if available
  if (classDescription) {
    mdx += `${classDescription}\n\n`;
  }

  // Separate namespaces from properties
  const namespaces = properties.filter(p => p.type.includes('Namespace'));
  const regularProperties = properties.filter(p => !p.type.includes('Namespace'));

  // Add namespaces section if available
  if (namespaces.length > 0) {
    mdx += `### Namespaces\n\n`;
    mdx += `| Namespace | Type | Description |\n`;
    mdx += `|-----------|------|-------------|\n`;
    for (const property of namespaces) {
      mdx += `| \`${property.name}\` | \`${property.type}\` | ${property.description} |\n`;
    }
    mdx += `\n`;
  }

  // Add properties section if available
  if (regularProperties.length > 0) {
    mdx += `### Properties\n\n`;
    mdx += `| Property | Type | Description |\n`;
    mdx += `|----------|------|-------------|\n`;
    for (const property of regularProperties) {
      mdx += `| \`${property.name}\` | \`${property.type}\` | ${property.description} |\n`;
    }
    mdx += `\n`;
  }

  // Add table of functions
  if (methods.length > 0) {
    mdx += `### Methods\n\n`;
    mdx += `| Function | Description |\n`;
    mdx += `|----------|-------------|\n`;
    for (const method of methods) {
      const methodLink = `#${method.name.toLowerCase()}`;
      mdx += `| **[${method.name}()](${methodLink})** | ${method.description || ''} |\n`;
    }
    mdx += `\n`;
  }

  for (const method of methods) {
    const githubUrl = `https://github.com/ethereum-optimism/actions/blob/${gitRef}/packages/sdk/${method.sourcePath}#L${method.lineNumber}`;

    mdx += `#### \`${method.name}()\`\n\n`;

    if (method.description) {
      mdx += `${method.description}\n\n`;
    }

    if (method.params.length > 0) {
      mdx += `**Parameters:**\n\n`;
      mdx += `| Parameter | Type | Description |\n`;
      mdx += `|-----------|------|-------------|\n`;
      for (const param of method.params) {
        // Remove leading " - " from description if present
        const cleanDescription = param.description.replace(/^\s*-\s*/, '');

        let typeCell = '';
        if (param.type) {
          if (param.typeDefinition) {
            // Create tooltip with type definition, escape backticks and pipes
            const escapedDef = param.typeDefinition
              .replace(/`/g, '\\`')
              .replace(/\|/g, '\\|')
              .replace(/\n/g, ' ');
            typeCell = `<Tooltip tip={\`${escapedDef}\`}>\`${param.type}\`</Tooltip>`;
          } else {
            typeCell = `\`${param.type}\``;
          }
        }

        mdx += `| \`${param.name}\` | ${typeCell} | ${cleanDescription} |\n`;
      }
      mdx += `\n`;
    }

    if (method.returns) {
      mdx += `**Returns:** ${method.returns}\n\n`;
    }

    if (method.throws) {
      mdx += `**Throws:** ${method.throws}\n\n`;
    }

    mdx += `<sub>[<Icon icon="github" /> ↗](${githubUrl})</sub>\n\n`;

    mdx += `---\n\n`;
  }

  return mdx;
}

async function main() {
  console.log("🔍 Looking for Actions SDK...");

  // Find the SDK package in node_modules
  const sdkPath = path.join(
    process.cwd(),
    "node_modules",
    "@eth-optimism",
    "actions-sdk"
  );

  if (!fs.existsSync(sdkPath)) {
    console.error("❌ Actions SDK not found. Please run: pnpm install");
    process.exit(1);
  }

  console.log("✅ Found Actions SDK at:", sdkPath);

  // Read package.json to get version for GitHub links
  const packageJsonPath = path.join(sdkPath, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const gitRef = `@eth-optimism/actions-sdk@${packageJson.version}`;
  console.log(`📌 Using git ref: ${gitRef}`);

  // Create a ts-morph project without tsconfig (published packages don't include it)
  const project = new Project({
    compilerOptions: {
      target: 99, // ESNext
      module: 99, // ESNext
    },
  });

  // Add all SDK source files to the project so ts-morph can resolve imports
  console.log("📚 Adding SDK source files to project for type resolution...");
  project.addSourceFilesAtPaths(`${sdkPath}/src/**/*.ts`);

  // Create snippets directory if it doesn't exist
  const snippetsDir = path.join(process.cwd(), "snippets", "actions");
  if (!fs.existsSync(snippetsDir)) {
    fs.mkdirSync(snippetsDir, { recursive: true });
  }

  // Generate docs for each configured API
  for (const [className, sourcePath] of Object.entries(ACTIONS_COMPONENTS)) {
    console.log(`\n📖 Processing ${className}...`);

    const sourceFilePath = path.join(sdkPath, sourcePath);

    if (!fs.existsSync(sourceFilePath)) {
      console.error(`❌ ${sourcePath} not found at: ${sourceFilePath}`);
      continue;
    }

    const sourceFile = project.addSourceFileAtPath(sourceFilePath);
    const classDeclaration = sourceFile.getClass(className);

    if (!classDeclaration) {
      console.error(`❌ ${className} class not found in ${sourcePath}`);
      continue;
    }

    console.log("📝 Extracting class and method documentation...");

    // Extract class description
    const classJsDoc = classDeclaration.getJsDocs()[0];
    const classDescription = classJsDoc ? classJsDoc.getDescription().trim() : '';

    const properties = extractPropertyDocs(classDeclaration);
    const methods = extractMethodDocs(classDeclaration, sourcePath, project);

    console.log(`✅ Found ${properties.length} documented properties and ${methods.length} documented methods`);

    // Convert ClassName to kebab-case for filename (WalletNamespace -> wallet-namespace)
    const componentFileName = className
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()
      .slice(1); // remove leading dash

    // Generate component
    console.log(`🏗️  Generating ${componentFileName}.mdx...`);
    const componentContent = generateComponentMDX(className, classDescription, properties, methods, gitRef);

    // Write to snippets directory
    const outputPath = path.join(snippetsDir, `${componentFileName}.mdx`);
    fs.writeFileSync(outputPath, componentContent);

    console.log(`✅ Component generated at: ${outputPath}`);

    console.log("💡 Use it in your docs with:");
    console.log(
      `   import ${className} from '/snippets/actions/${componentFileName}.mdx';`
    );
    console.log(`   <${className} />`);
  }

  console.log("\n🎉 All API docs generated successfully!");
}

main().catch(console.error);
