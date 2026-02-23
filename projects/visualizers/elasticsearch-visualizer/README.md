# Elasticsearch Internals — Interactive Visualizer

An interactive, single-page web application that teaches Elasticsearch internals through live, hands-on visualizations. Built with vanilla HTML, CSS, and JavaScript.

## 🎯 Sections

| # | Section | What You Learn |
|---|---------|---------------|
| 01 | Cluster Architecture | Nodes, roles, master election |
| 02 | Indices, Shards & Replicas | Data distribution, fault tolerance |
| 03 | The Inverted Index | Core data structure, live builder |
| 04 | Analyzers & Tokenization | Standard, whitespace, keyword, custom pipelines |
| 05 | Document Indexing Flow | Memory buffer → translog → refresh → segment → merge |
| 06 | Full-Text Search | match, match_phrase, multi_match with BM25 scoring |
| 07 | Fuzzy Search & Edit Distance | Levenshtein matrix, fuzziness levels |
| 08 | Query DSL & Scoring | Bool query builder, TF-IDF vs BM25 |
| 09 | Aggregations | Terms, range, date histogram, stats |
| 10 | Scaling & Shard Allocation | Horizontal scaling, rebalancing |
| 11 | Segment Merging | Merge process, force merge, performance |
| 12 | ES vs RDBMS | Side-by-side terminology comparison |

## 🚀 Getting Started

```bash
# Serve locally
npx -y serve . -l 8091

# Open in browser
open http://localhost:8091
```

## 🛠 Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Custom design system (dark theme, glassmorphism, amber/cyan palette)
- **JavaScript** — Vanilla JS, no dependencies
- **Fonts** — Inter + JetBrains Mono (Google Fonts)
