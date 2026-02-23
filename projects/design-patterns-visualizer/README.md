# Java Design Patterns — Interactive Visualizer

Interactive web app to learn the **10 most frequently asked Java design patterns** through animated visualizations and hands-on demos.

## 🎯 Patterns Covered

| # | Pattern | Category | Interactive Demo |
|---|---------|----------|-----------------|
| 01 | **Singleton** | Creational | Instance identity test + 5 thread-safety code variants |
| 02 | **Factory Method** | Creational | Create notifications by type with animated pipeline |
| 03 | **Abstract Factory** | Creational | Dark/Light theme factory producing matching components |
| 04 | **Builder** | Creational | Step-by-step fluent builder chain with final .build() |
| 05 | **Strategy** | Behavioral | Swap sorting algorithms at runtime |
| 06 | **Observer** | Behavioral | Add/remove subscribers, fire events with cascade notification |
| 07 | **Decorator** | Structural | Stack coffee decorators to see wrapping pipeline grow |
| 08 | **Adapter** | Structural | XML→JSON adapter bridging incompatible interfaces |
| 09 | **Proxy** | Structural | Caching proxy demo — cache hit vs miss |
| 10 | **Template Method** | Behavioral | Same algorithm skeleton, different implementation steps |

## ✨ Features

- **Animated Class Diagrams** — UML boxes light up to show the flow
- **Live Code Variants** — Toggle between implementations (e.g., 5 Singleton variants)
- **Interactive Demos** — Click to see patterns in action with animations
- **Interview Tips** — Collapsible cards with key talking points per pattern
- **Real-World Examples** — Where each pattern appears in Java/Spring
- **Dark Theme** — Premium glassmorphism design with gradient accents
- **Responsive** — Works on desktop and mobile

## 🚀 How to Run

```bash
# Option 1: Open directly
open projects/design-patterns-visualizer/index.html

# Option 2: Serve locally
npx -y serve ./projects/design-patterns-visualizer -l 4567
# Then open http://localhost:4567
```

## 🛠 Tech Stack

- Vanilla HTML / CSS / JavaScript (no frameworks)
- Google Fonts (Inter + JetBrains Mono)
- IntersectionObserver for scroll-reveal animations
