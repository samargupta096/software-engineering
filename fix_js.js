const fs = require('fs');
const path = require('path');

const visualizers = [
    'aws-services-visualizer',
    'db-indexing-visualizer',
    'design-patterns-visualizer',
    'elasticsearch-visualizer',
    'internet-networking-visualizer',
    'kafka-visualizer',
    'vector-db-visualizer',
    'system-design-prep',
    'llm-parameters-visualizer'
];

visualizers.forEach(vis => {
    const filePath = path.join(vis, 'index.js');
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');
        content = content.replace(/'use strict';\\n/g, "'use strict';\n");
        content = content.replace(/"use strict";\\n/g, '"use strict";\n');
        content = content.replace(/observe\(s\)\);\\n/g, 'observe(s));\n');
        content = content.replace(/\\ndocument\.addEventListener/g, '\ndocument.addEventListener');
        fs.writeFileSync(filePath, content);
    }
});
