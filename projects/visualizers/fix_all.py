import os

visualizers = [
    'aws-services-visualizer',
    'db-indexing-visualizer',
    'design-patterns-visualizer',
    'elasticsearch-visualizer',
    'internet-networking-visualizer',
    'kafka-visualizer',
    'vector-db-visualizer',
    'system-design-prep',
    'llm-parameters-visualizer'
]

for vis in visualizers:
    html_file = os.path.join(vis, 'index.html')
    if os.path.exists(html_file):
        with open(html_file, 'r') as f:
            content = f.read()
        content = content.replace('\\n    <!--', '\n    <!--')
        content = content.replace('\\n    <nav', '\n    <nav')
        content = content.replace('\\n      <div', '\n      <div')
        content = content.replace('\\n        <a', '\n        <a')
        content = content.replace('\\n      </div>', '\n      </div>')
        content = content.replace('\\n    </nav>', '\n    </nav>')
        content = content.replace('\\n    <main>', '\n    <main>')
        with open(html_file, 'w') as f:
            f.write(content)

    css_file = os.path.join(vis, 'index.css')
    if os.path.exists(css_file):
        with open(css_file, 'r') as f:
            content = f.read()
        content = content.replace('\\n\\n/* ════', '\n\n/* ════')
        content = content.replace('\\n/* ════', '\n/* ════')
        content = content.replace('\\n.toc', '\n.toc')
        content = content.replace('\\n\n/* ════', '\n\n/* ════')
        with open(css_file, 'w') as f:
            f.write(content)

    js_file = os.path.join(vis, 'index.js')
    if os.path.exists(js_file):
        with open(js_file, 'r') as f:
            content = f.read()
        content = content.replace("'use strict';\\n", "'use strict';\n")
        content = content.replace('"use strict";\\n', '"use strict";\n')
        content = content.replace('\\ndocument.addEventListener', '\ndocument.addEventListener')
        content = content.replace('\\n/* ════', '\n/* ════')
        content = content.replace('observe(s));\\n', 'observe(s));\n')
        content = content.replace('\\n//', '\n//')
        with open(js_file, 'w') as f:
            f.write(content)

print("Done")
