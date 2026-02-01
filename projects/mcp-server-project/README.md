# MCP Server Project

> Build a Custom MCP Server with Tool Integration

## 🎯 Project Overview

A complete Model Context Protocol (MCP) server demonstrating:
- **Custom tools** for database queries and API calls
- **Resources** for exposing documents to LLMs
- **Prompts** for predefined templates
- **Integration** with Claude Desktop & other MCP clients

## 🏗️ Architecture

```
┌──────────────────┐     ┌──────────────────┐
│  Claude Desktop  │────▶│   MCP Server     │
│  (MCP Host)      │◀────│   (Python)       │
└──────────────────┘     └──────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
              ┌─────────┐ ┌─────────┐ ┌─────────┐
              │ Database│ │  APIs   │ │  Files  │
              │ (SQLite)│ │ (REST)  │ │ System  │
              └─────────┘ └─────────┘ └─────────┘
```

## 📁 Project Structure

```
mcp-server-project/
├── src/
│   ├── server.py           # Main MCP server
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── database.py     # Database tools
│   │   ├── api.py          # API integration tools
│   │   └── filesystem.py   # File system tools
│   ├── resources/
│   │   └── documents.py    # Document resources
│   └── prompts/
│       └── templates.py    # Prompt templates
├── data/
│   └── sample.db           # Sample SQLite database
├── config.json             # Server configuration
├── requirements.txt
└── README.md
```

## 🚀 Quick Start

### 1. Setup

```bash
cd projects/mcp-server-project

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "my-tools": {
      "command": "python",
      "args": ["C:/path/to/mcp-server-project/src/server.py"],
      "env": {
        "DATABASE_PATH": "C:/path/to/data/sample.db"
      }
    }
  }
}
```

### 3. Run Standalone (for testing)

```bash
python src/server.py
```

## 🔧 Available Tools

| Tool | Description |
|------|-------------|
| `query_database` | Execute SQL SELECT queries |
| `list_tables` | List all database tables |
| `search_documents` | Search internal documents |
| `fetch_api` | Make HTTP API calls |
| `read_file` | Read file contents |
| `list_directory` | List directory contents |

## 📖 Resources

| Resource URI | Description |
|--------------|-------------|
| `docs://policies` | Company policies |
| `docs://procedures` | Standard procedures |
| `db://schema` | Database schema info |

## 💬 Prompts

| Prompt | Description |
|--------|-------------|
| `summarize_data` | Summarize database results |
| `analyze_document` | Analyze a document |

## 💡 Key Learnings

1. **MCP Protocol**: Standard for AI-tool connectivity
2. **Tool Design**: Clear names, descriptions, parameter validation
3. **Resource Management**: Expose data safely to LLMs
4. **Security**: Controlled access to sensitive operations

## 📚 Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Agentic AI Guide](../../components/genai/agentic-ai-guide.md)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)

---

*Part of the [GenAI Learning Curriculum](../../components/genai/)*
