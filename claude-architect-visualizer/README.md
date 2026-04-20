# Claude Certified Architect (CCA) Exam Prep Visualizer

An interactive learning module designed to help engineers prepare for the **Claude Certified Architect - Foundations** exam. 

This visualizer translates the abstract concepts from the official exam domains into tangible, interactive sandboxes. It runs entirely in the browser using Vanilla JS, HTML, and CSS.

## 🚀 Exam Domains Covered

This module tackles the 5 core weightings of the CCA exam:

1. **Agentic Architecture & Orchestration (27%)**: Visualizes a Supervisor Agent decomposing user prompts and delegating sub-tasks to Researcher, Coder, and Reviewer agents.
2. **Claude Code Configuration (20%)**: A file explorer demonstrating how `CLAUDE.md` files cascade context and slash commands down through project directories.
3. **Prompt Engineering & Structured Output (20%)**: A side-by-side parsing simulator showing why strict programmatic schema enforcement via Tool Use is safer than loose prompting for JSON.
4. **Tool Design & MCP Integration (18%)**: Toggle mock Model Context Protocol (MCP) servers (GitHub, Postgres) to dynamically inject tools into Claude's simulated context.
5. **Context Management & Reliability (15%)**: A token-math playground that graphs the 200k context window, highlighting prompt caching discount zones.

## 💻 Tech Stack
- **HTML5**: Semantic layout.
- **CSS3**: Glassmorphism aesthetic, CSS Grid/Flexbox layouts, and custom keyframe animations.
- **Vanilla JavaScript**: State management for all five interactive sandboxes.

## 🏃 How to Run
Since the project relies solely on static files, you can simply run it locally using any static web server from the repository root:

```bash
# Using Python
python3 -m http.server 8000

# Using Node
npx serve
```
Then navigate to the Interactive Visualizers Hub and select the **Claude Architect Prep** card.
