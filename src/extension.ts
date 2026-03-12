import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

interface Relationship {
  type: string;
  related: string;
}

interface Column {
  name: string;
  type: string;
}

interface ForeignKey {
  column: string;
  references: string;
  on: string;
}

interface TableInfo {
  tableName: string;
  columns: Column[];
  foreignKeys: ForeignKey[];
}

interface ModelInfo {
  name: string;
  tableName: string;
  relationships: Relationship[];
}

export function activate(context: vscode.ExtensionContext) {
  const generateDocsCommand = vscode.commands.registerCommand(
    "laravel-model-markdown-generator.generateDocs",
    async () => {
      const rootPath = getWorkspaceRoot();
      if (!rootPath) {
        return;
      }

      if (!isLaravelProject(rootPath)) {
        vscode.window.showErrorMessage("This is not a Laravel project.");
        return;
      }

      const models = parseModels(rootPath);
      const tables = parseMigrations(rootPath);

      const markdown = generateMarkdown(models, tables);

      await openMarkdown(markdown);
    }
  );

  context.subscriptions.push(generateDocsCommand);
}

export function deactivate() {}

// ---------------------------------
// Recursive Directory Scanner
// ---------------------------------

function getAllPhpFiles(dir: string): string[] {
  let results: string[] = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(getAllPhpFiles(fullPath));
    } else if (file.endsWith(".php")) {
      results.push(fullPath);
    }
  });

  return results;
}

// ---------------------------------
// Model Parsing (Recursive)
// ---------------------------------

function parseModels(rootPath: string): ModelInfo[] {
  const modelsPath = path.join(rootPath, "app", "Models");
  const files = getAllPhpFiles(modelsPath);

  return files.map(filePath => {
    const content = fs.readFileSync(filePath, "utf-8");
    const name = path.basename(filePath).replace(".php", "");

    return {
      name,
      tableName: guessTableName(name),
      relationships: extractRelationships(content)
    };
  });
}

// ---------------------------------
// Migration Parsing (Recursive)
// ---------------------------------

function parseMigrations(rootPath: string): TableInfo[] {
  const migrationsPath = path.join(rootPath, "database", "migrations");
  const files = getAllPhpFiles(migrationsPath);

  const tables: TableInfo[] = [];

  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, "utf-8");

    const tableMatch = content.match(/Schema::create\(['"](.+?)['"]/);
    if (!tableMatch) {
      return;
    }

    const tableName = tableMatch[1];

    const columns: Column[] = [];
    const foreignKeys: ForeignKey[] = [];

    const columnRegex = /\$table->(\w+)\(['"](.+?)['"]/g;
    let colMatch;
    while ((colMatch = columnRegex.exec(content)) !== null) {
      columns.push({
        type: colMatch[1],
        name: colMatch[2]
      });
    }

    // Traditional foreign key syntax
    const foreignRegex =
      /\$table->foreign\(['"](.+?)['"]\)->references\(['"](.+?)['"]\)->on\(['"](.+?)['"]\)/g;

    let fkMatch;
    while ((fkMatch = foreignRegex.exec(content)) !== null) {
      foreignKeys.push({
        column: fkMatch[1],
        references: fkMatch[2],
        on: fkMatch[3]
      });
    }

    tables.push({
      tableName,
      columns,
      foreignKeys
    });
  });

  return tables;
}

// ---------------------------------
// Relationship Extraction
// ---------------------------------

function extractRelationships(content: string): Relationship[] {
  const relationshipRegex =
    /(hasOne|hasMany|belongsTo|belongsToMany|morphTo|morphMany|morphOne)\s*\(\s*([^)]+)\)/g;

  const relationships: Relationship[] = [];

  let match;

  while ((match = relationshipRegex.exec(content)) !== null) {
    const type = match[1];
    const relatedRaw = match[2];

    const related = relatedRaw
      .replace("::class", "")
      .split("\\")
      .pop()
      ?.trim();

    relationships.push({
      type,
      related: related || relatedRaw
    });
  }

  return relationships;
}

// ---------------------------------
// Markdown Generator (Graceful Fallback)
// ---------------------------------

function generateMarkdown(models: ModelInfo[], tables: TableInfo[]): string {
  let markdown = `# Database Documentation\n\n`;

  if (tables.length === 0) {
    markdown += `⚠️ No migrations found. Only model relationships were analyzed.\n\n`;
  }

  if (models.length === 0) {
    markdown += `⚠️ No models found.\n\n`;
  }

  tables.forEach(table => {
    markdown += `## Table: ${table.tableName}\n\n`;

    markdown += `### Columns\n\n`;
    if (table.columns.length === 0) {
      markdown += `_No columns detected._\n`;
    } else {
      table.columns.forEach(col => {
        markdown += `- ${col.name} (${col.type})\n`;
      });
    }

    if (table.foreignKeys.length > 0) {
      markdown += `\n### Foreign Keys\n\n`;
      table.foreignKeys.forEach(fk => {
        markdown += `- ${fk.column} → ${fk.on}.${fk.references}\n`;
      });
    }

    const relatedModel = models.find(
      m => guessTableName(m.name) === table.tableName
    );

    if (relatedModel && relatedModel.relationships.length > 0) {
      markdown += `\n### Eloquent Relationships\n\n`;
      relatedModel.relationships.forEach(rel => {
        markdown += `- ${rel.type} → ${rel.related}\n`;
      });
    }

    markdown += `\n---\n\n`;
  });

  // If no migrations but models exist → show relationships only
  if (tables.length === 0 && models.length > 0) {
    markdown += `## Model Relationships\n\n`;

    models.forEach(model => {
      markdown += `### ${model.name}\n\n`;

      if (model.relationships.length === 0) {
        markdown += `_No relationships detected._\n\n`;
      } else {
        model.relationships.forEach(rel => {
          markdown += `- ${rel.type} → ${rel.related}\n`;
        });
        markdown += "\n";
      }
    });
  }

  return markdown;
}

// ---------------------------------
// Utilities
// ---------------------------------

function guessTableName(modelName: string): string {
  return modelName.toLowerCase() + "s";
}

function getWorkspaceRoot(): string | null {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage("No workspace open.");
    return null;
  }
  return workspaceFolders[0].uri.fsPath;
}

function isLaravelProject(rootPath: string): boolean {
  return fs.existsSync(path.join(rootPath, "artisan"));
}

async function openMarkdown(content: string) {
  const doc = await vscode.workspace.openTextDocument({
    content,
    language: "markdown"
  });
  await vscode.window.showTextDocument(doc);
}
