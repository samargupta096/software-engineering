# Claude Certified Architect (CCA) Exam Prep Visualizer

An interactive learning module designed to help engineers prepare for the **Claude Certified Architect - Foundations** exam. 

This visualizer translates the abstract concepts from the official exam domains into tangible, interactive sandboxes. It runs entirely in the browser using Vanilla JS, HTML, and CSS.

## 🚀 Comprehensive Study Features

This module tackles the 5 core weightings of the CCA exam, blending active recall with hands-on practice:

1. **Theory vs Practice Tabs:** Every domain is split between a "Theory & Best Practices" tab (containing exam gotchas and Anthropic guidelines) and an "Interactive Sandbox" tab.
2. **Agentic Architecture Simulator (27%)**: Visualizes a Supervisor Agent decomposing user prompts and delegating sub-tasks.
3. **Claude Code Configuration (20%)**: A file explorer demonstrating how `CLAUDE.md` files cascade.
4. **Prompt Engineering & Structured Output (20%)**: A side-by-side parsing simulator showing Tool Use schemas vs loose prompting.
5. **Tool Design & MCP Integration (18%)**: Toggle mock Model Context Protocol servers to dynamically inject tools.
6. **Context Management & Reliability (15%)**: A token-math playground graphing the 200k context window.
7. **Active Recall Flashcards:** CSS 3D-flippable flashcards to memorize key terminology.
8. **Scenario-Based Mock Quiz:** A built-in quiz engine testing your architectural judgment against common production scenarios.

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
