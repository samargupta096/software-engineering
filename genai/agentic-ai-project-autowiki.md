# 📚 AutoWiki for Git — An Agentic AI Project

> **AutoWiki** is an autonomous AI agent designed to solve the perennial problem of stale documentation. By crawling a Git repository, extracting its structure, and using LLMs to synthesize documentation, AutoWiki generates and maintains a comprehensive, human-readable Wiki for any codebase.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Indexing Pipeline](#2-repository-indexing-pipeline)
3. [File Tree Explorer](#3-file-tree-explorer)
4. [Search: Files, Functions, Classes](#4-search-files-functions-classes)
5. [AI-Generated Documentation](#5-ai-generated-documentation)
6. [Copy AI-Generated Docs](#6-copy-ai-generated-docs)
7. [Export Wiki as Markdown/PDF](#7-export-wiki-as-markdownpdf)
8. [Architecture](#8-architecture)

---

## 1. Project Overview

### The Problem
- OSS projects lack resources to write comprehensive docs.
- Internal corporate repositories suffer from "stale doc syndrome" as code outpaces documentation.
- Developer onboarding takes weeks because undocumented tribal knowledge is hidden in code.

### The Solution: AutoWiki
An Agentic system that:
1. Clones and indexes a target Git repository.
2. Uses Tree-sitter to parse code into an Abstract Syntax Tree (AST).
3. Agents generate summaries for functions, classes, and entire files.
4. Synthesizes a searchable web UI (the Wiki).
5. Exports to Markdown or PDF.

---

## 2. Repository Indexing Pipeline

Before AI can document the code, we must extract it.

### Step 1: Crawl the Repo
We need to walk the file system, ignoring `.git`, `node_modules`, and binary files.

```python
import os
import pathspec # For parsing .gitignore

def get_files_to_index(repo_path: str):
    # Load .gitignore rules
    gitignore_path = os.path.join(repo_path, '.gitignore')
    spec = pathspec.PathSpec.from_lines('gitwildmatch', open(gitignore_path)) if os.path.exists(gitignore_path) else None
    
    target_files = []
    for root, dirs, files in os.walk(repo_path):
        # Ignore common hidden dirs
        if '.git' in dirs: dirs.remove('.git')
        if 'node_modules' in dirs: dirs.remove('node_modules')
            
        for file in files:
            rel_path = os.path.relpath(os.path.join(root, file), repo_path)
            
            # Check against gitignore
            if spec and spec.match_file(rel_path):
                continue
                
            # Filter by extension (only index code/text)
            if rel_path.endswith(('.py', '.js', '.ts', '.go', '.md', '.rs')):
                target_files.append(rel_path)
                
    return target_files
```

### Step 2: AST Parsing (Tree-sitter)
Regex is not enough to extract functions and classes. We use **Tree-sitter** to parse the code accurately regardless of the language.

```python
# Pseudo-code for AST Extraction using Tree-sitter
from tree_sitter import Language, Parser

def extract_symbols(file_content: str, language: str):
    parser = get_parser_for_lang(language)
    tree = parser.parse(bytes(file_content, "utf8"))
    
    symbols = []
    # Query for functions and classes (varies by language grammar)
    query = get_query_for_lang(language, """
        (function_definition name: (identifier) @func.name)
        (class_definition name: (identifier) @class.name)
    """)
    
    captures = query.captures(tree.root_node)
    for node, tag in captures:
        symbols.append({
            "type": "function" if "func" in tag else "class",
            "name": node.text.decode('utf8'),
            "start_line": node.start_point[0],
            "end_line": node.end_point[0]
        })
        
    return symbols
```

---

## 3. File Tree Explorer

The UI needs a sidebar to navigate the repo. Instead of sending flat paths, we build a nested tree structure.

```typescript
// Frontend data structure for the Tree
interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
  metadata?: {
    size: number;
    language: string;
    symbolsCount: number;
  }
}

// Convert flat paths to nested tree
function buildTree(paths: string[]): FileNode {
  const root: FileNode = { name: 'root', type: 'directory', path: '', children: [] };
  
  paths.forEach(path => {
    const parts = path.split('/');
    let current = root;
    
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join('/');
      
      let node = current.children!.find(c => c.name === part);
      if (!node) {
        node = {
          name: part,
          type: isFile ? 'file' : 'directory',
          path: currentPath,
          children: isFile ? undefined : []
        };
        current.children!.push(node);
      }
      current = node;
    });
  });
  return root;
}
```

---

## 4. Search: Files, Functions, Classes

Users need to find code instantly. We store the extracted symbols in SQLite using FTS5 (Full Text Search).

### Database Schema
```sql
CREATE VIRTUAL TABLE symbol_index USING fts5(
    file_path,
    symbol_name,
    symbol_type, -- 'function', 'class', 'file'
    content      -- The raw code or AI docstring
);
```

### Search Implementation
```python
def search_codebase(query: str, limit: int = 10):
    db = get_db_connection()
    cursor = db.cursor()
    
    # FTS Match query
    cursor.execute("""
        SELECT file_path, symbol_name, symbol_type, snippet(symbol_index, 3, '<b>', '</b>', '...', 10) as highlight
        FROM symbol_index
        WHERE symbol_index MATCH ?
        ORDER BY rank
        LIMIT ?
    """, (f'*{query}*', limit))
    
    return cursor.fetchall()
```

---

## 5. AI-Generated Documentation

This is the core Agentic feature. We iterate over every file and symbol and ask an LLM to generate documentation.

### Prompt Template for File Documentation
```python
from openai import OpenAI
client = OpenAI()

def generate_file_doc(file_path: str, file_content: str, symbols: list):
    prompt = f"""
    You are an expert technical writer. Write documentation for the following file.
    
    File Path: {file_path}
    Symbols defined in this file: {', '.join([s['name'] for s in symbols])}
    
    Code:
    ```
    {file_content}
    ```
    
    Output exactly in this Markdown format:
    # `[File Name]`
    **Purpose:** [1-2 sentences explaining what this file does in the broader system]
    
    ## Key Components
    - **`[Symbol Name]`**: [Brief description]
    
    ## Usage / Example
    [Provide a brief code example showing how to use the primary class/function exported by this file]
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content
```

### Handling Context Limits
If a file is 5,000 lines long, it might exceed token limits or result in degraded output.
**Solution:** Document symbols individually first, then aggregate those summaries to document the file.

---

## 6. Copy AI-Generated Docs

Provide one-click functionality in the UI to copy the AI documentation back into the codebase as comments.

### Frontend Clipboard API
```javascript
async function copyAsDocstring(aiContent, language) {
    let formattedCode = aiContent;
    
    if (language === 'python') {
        formattedCode = `"""\n${aiContent}\n"""`;
    } else if (language === 'typescript' || language === 'javascript') {
        // Wrap in JSDoc
        const lines = aiContent.split('\n');
        formattedCode = `/**\n * ${lines.join('\n * ')}\n */`;
    }
    
    try {
        await navigator.clipboard.writeText(formattedCode);
        showToast("Copied to clipboard!");
    } catch (err) {
        console.error("Failed to copy: ", err);
    }
}
```

---

## 7. Export Wiki as Markdown/PDF

Users want to export the entire generated Wiki as a single document.

### Markdown Compilation
Concatenate all generated docs into a single string, adding a Table of Contents.

```python
def generate_full_wiki_markdown(docs_db):
    wiki = "# Project Wiki\n\n## Table of Contents\n"
    
    # 1. Generate TOC
    for doc in docs_db:
        wiki += f"- [{doc.file_name}](#{doc.file_name.lower().replace('.', '')})\n"
        
    wiki += "\n---\n\n"
    
    # 2. Append Content
    for doc in docs_db:
        wiki += f"{doc.ai_generated_markdown}\n\n---\n\n"
        
    return wiki
```

### PDF Generation
Use a tool like `markdown-pdf` (Node) or `WeasyPrint` (Python).
```bash
# Export using a CLI tool
npx markdown-pdf wiki.md -o output/Project_Wiki.pdf
```

---

## 8. Architecture

### Tech Stack Recommendations
- **Backend:** FastAPI (Python) - Great for async tasks and AI integrations.
- **Frontend:** Next.js (React) + TailwindCSS for the Wiki UI.
- **Database:** SQLite (local) or PostgreSQL (hosted) for storing AST data and AI summaries.
- **Parsing:** Tree-sitter (Python bindings).
- **LLM:** OpenAI `gpt-4o-mini` (cheap, fast, good enough for code summarizing).

### System Diagram
```ascii
┌──────────────────┐       ┌───────────────────────┐
│  Target Git Repo │ ────▶ │  1. Crawler & Parser  │
└──────────────────┘       │  (Tree-sitter)        │
                           └──────────┬────────────┘
                                      │
                                      ▼
                           ┌───────────────────────┐
                           │  2. SQLite Database   │ ◀──────┐
                           │  (Symbols & Paths)    │        │
                           └──────────┬────────────┘        │
                                      │                     │ Search / UI
                                      ▼                     │
┌──────────────────┐       ┌───────────────────────┐        │
│    OpenAI API    │ ◀───▶ │  3. AI Doc Generator  │        │
└──────────────────┘       │  (Agentic Loop)       │        │
                           └──────────┬────────────┘        │
                                      │                     │
                                      ▼                     │
                           ┌───────────────────────┐        │
                           │  4. Next.js Web UI    │ ───────┘
                           │  (Wiki Frontend)      │
                           └───────────────────────┘
                                      │
                                      ▼
                           ┌───────────────────────┐
                           │  5. Exporter          │
                           │  (PDF / Markdown)     │
                           └───────────────────────┘
```

---

> *"Code tells you how, documentation tells you why. AutoWiki ensures the 'why' is never left behind."*
