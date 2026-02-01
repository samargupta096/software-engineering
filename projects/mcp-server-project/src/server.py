"""
MCP Server - Custom Tool Server

A Model Context Protocol server that exposes tools for:
- Database queries (SQLite)
- API calls
- File system operations

Run with: python src/server.py
"""

import os
import json
import asyncio
import sqlite3
from pathlib import Path
from typing import Optional

from mcp.server import Server
from mcp.types import (
    Tool,
    TextContent,
    Resource,
    Prompt,
    PromptMessage,
    GetPromptResult,
)
import mcp.server.stdio

# Load environment
DATABASE_PATH = os.environ.get("DATABASE_PATH", "./data/sample.db")
DOCS_PATH = os.environ.get("DOCS_PATH", "./data/docs")

# Create server
server = Server("my-tools-server")


# ============== TOOLS ==============

@server.tool()
async def query_database(query: str) -> str:
    """
    Execute a SQL SELECT query on the database.
    Only SELECT queries are allowed for safety.
    
    Args:
        query: SQL SELECT query to execute
    
    Returns:
        Query results as formatted text
    """
    # Security: Only allow SELECT
    if not query.strip().upper().startswith("SELECT"):
        return "Error: Only SELECT queries are allowed"
    
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute(query)
        
        # Get column names
        columns = [description[0] for description in cursor.description]
        rows = cursor.fetchall()
        
        conn.close()
        
        if not rows:
            return "No results found"
        
        # Format as table
        result = " | ".join(columns) + "\n"
        result += "-" * len(result) + "\n"
        for row in rows[:50]:  # Limit to 50 rows
            result += " | ".join(str(v) for v in row) + "\n"
        
        if len(rows) > 50:
            result += f"\n... and {len(rows) - 50} more rows"
        
        return result
    
    except Exception as e:
        return f"Database error: {str(e)}"


@server.tool()
async def list_tables() -> str:
    """
    List all tables in the database.
    
    Returns:
        List of table names with their columns
    """
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        result = "Database Tables:\n\n"
        
        for (table_name,) in tables:
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            
            result += f"## {table_name}\n"
            for col in columns:
                col_name, col_type = col[1], col[2]
                result += f"  - {col_name} ({col_type})\n"
            result += "\n"
        
        conn.close()
        return result
    
    except Exception as e:
        return f"Error: {str(e)}"


@server.tool()
async def search_documents(
    query: str,
    folder: str = "all"
) -> str:
    """
    Search for documents containing specific text.
    
    Args:
        query: Text to search for
        folder: Folder to search in ('all' for all folders)
    
    Returns:
        Matching document snippets
    """
    docs_path = Path(DOCS_PATH)
    
    if not docs_path.exists():
        return f"Documents folder not found: {DOCS_PATH}"
    
    results = []
    
    # Search recursively
    pattern = "**/*.md" if folder == "all" else f"{folder}/*.md"
    
    for file_path in docs_path.glob(pattern):
        try:
            content = file_path.read_text(encoding="utf-8")
            if query.lower() in content.lower():
                # Find matching lines
                lines = content.split("\n")
                matching = [
                    line.strip() for line in lines
                    if query.lower() in line.lower()
                ][:3]  # First 3 matches
                
                results.append({
                    "file": str(file_path.relative_to(docs_path)),
                    "matches": matching
                })
        except Exception:
            continue
    
    if not results:
        return f"No documents found matching: {query}"
    
    output = f"Found {len(results)} documents:\n\n"
    for r in results[:10]:
        output += f"**{r['file']}**\n"
        for match in r['matches']:
            output += f"  - {match[:100]}...\n"
        output += "\n"
    
    return output


@server.tool()
async def fetch_api(
    url: str,
    method: str = "GET",
    headers: Optional[str] = None
) -> str:
    """
    Make an HTTP API request.
    
    Args:
        url: API endpoint URL
        method: HTTP method (GET, POST)
        headers: Optional JSON string of headers
    
    Returns:
        API response
    """
    import httpx
    
    try:
        parsed_headers = json.loads(headers) if headers else {}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method=method.upper(),
                url=url,
                headers=parsed_headers
            )
            
            return f"Status: {response.status_code}\n\n{response.text[:2000]}"
    
    except Exception as e:
        return f"API error: {str(e)}"


@server.tool()
async def read_file(path: str) -> str:
    """
    Read the contents of a file.
    Only files in allowed directories can be read.
    
    Args:
        path: Relative path to the file
    
    Returns:
        File contents
    """
    # Security: Only allow reading from specific directories
    allowed_dirs = [Path(DOCS_PATH)]
    
    file_path = Path(path)
    
    # Check if path is in allowed directory
    is_allowed = any(
        file_path.resolve().is_relative_to(d.resolve())
        for d in allowed_dirs
    )
    
    if not is_allowed:
        return "Error: Access denied. File is outside allowed directories."
    
    if not file_path.exists():
        return f"Error: File not found: {path}"
    
    try:
        content = file_path.read_text(encoding="utf-8")
        return content[:10000]  # Limit size
    except Exception as e:
        return f"Error reading file: {str(e)}"


# ============== RESOURCES ==============

@server.list_resources()
async def list_resources():
    """List available resources"""
    return [
        Resource(
            uri="docs://policies",
            name="Company Policies",
            description="Internal company policies and guidelines"
        ),
        Resource(
            uri="docs://procedures",
            name="Standard Procedures",
            description="Standard operating procedures"
        ),
        Resource(
            uri="db://schema",
            name="Database Schema",
            description="Current database structure and tables"
        ),
    ]


@server.read_resource()
async def read_resource(uri: str):
    """Read a specific resource"""
    
    if uri == "docs://policies":
        policies_path = Path(DOCS_PATH) / "policies.md"
        if policies_path.exists():
            content = policies_path.read_text()
        else:
            content = "No policies document found."
        return TextContent(text=content)
    
    elif uri == "docs://procedures":
        procs_path = Path(DOCS_PATH) / "procedures.md"
        if procs_path.exists():
            content = procs_path.read_text()
        else:
            content = "No procedures document found."
        return TextContent(text=content)
    
    elif uri == "db://schema":
        # Generate schema from database
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        schema = "# Database Schema\n\n"
        for (table_name,) in tables:
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            schema += f"## {table_name}\n"
            for col in columns:
                schema += f"- {col[1]} ({col[2]})\n"
            schema += "\n"
        
        conn.close()
        return TextContent(text=schema)
    
    return TextContent(text=f"Unknown resource: {uri}")


# ============== PROMPTS ==============

@server.list_prompts()
async def list_prompts():
    """List available prompts"""
    return [
        Prompt(
            name="summarize_data",
            description="Summarize database query results",
            arguments=["table_name"]
        ),
        Prompt(
            name="analyze_document",
            description="Analyze and extract key points from a document",
            arguments=["document_path"]
        ),
    ]


@server.get_prompt()
async def get_prompt(name: str, arguments: dict):
    """Get a specific prompt"""
    
    if name == "summarize_data":
        table = arguments.get("table_name", "unknown")
        return GetPromptResult(
            messages=[
                PromptMessage(
                    role="user",
                    content=TextContent(
                        text=f"""Please analyze the data from the {table} table.
                        
1. First, use the list_tables tool to see the schema
2. Then, use query_database to get sample data
3. Provide a summary including:
   - Number of records
   - Key patterns or trends
   - Notable outliers
   - Recommendations"""
                    )
                )
            ]
        )
    
    elif name == "analyze_document":
        doc_path = arguments.get("document_path", "")
        return GetPromptResult(
            messages=[
                PromptMessage(
                    role="user",
                    content=TextContent(
                        text=f"""Please analyze the document at: {doc_path}
                        
Use the read_file tool to access the document, then provide:
1. Main topics covered
2. Key takeaways
3. Action items (if any)
4. Summary in 2-3 sentences"""
                    )
                )
            ]
        )
    
    return GetPromptResult(messages=[])


# ============== MAIN ==============

async def main():
    """Run the MCP server"""
    print("Starting MCP Server...")
    print(f"Database: {DATABASE_PATH}")
    print(f"Documents: {DOCS_PATH}")
    
    # Run with stdio transport (for Claude Desktop)
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
