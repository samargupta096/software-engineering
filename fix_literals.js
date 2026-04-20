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
    ['index.html', 'index.css', 'index.js'].forEach(file => {
        const filePath = path.join(vis, file);
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf-8');
            if (file === 'index.html') {
                content = content.replace(/\\n    <!--/g, '\n    <!--');
                content = content.replace(/\\n    <nav/g, '\n    <nav');
                content = content.replace(/\\n      <div/g, '\n      <div');
                content = content.replace(/\\n        <a/g, '\n        <a');
                content = content.replace(/\\n      <\/div>/g, '\n      </div>');
                content = content.replace(/\\n    <\/nav>/g, '\n    </nav>');
                content = content.replace(/\\n    <main>/g, '\n    <main>');
                content = content.replace(/\\n/g, '\n'); // Wait, if I do this I might break something? No, HTML doesn't usually use \n literal.
            } else if (file === 'index.css') {
                content = content.replace(/\\n/g, '\n'); // CSS doesn't usually use \n literal either, except in content: "\n" which is rare.
            } else if (file === 'index.js') {
                content = content.replace(/\\ndocument/g, '\ndocument');
                content = content.replace(/\\n"use strict"/g, '\n"use strict"');
                content = content.replace(/\\n'use strict'/g, "\n'use strict'");
            }
            fs.writeFileSync(filePath, content);
            console.log(`Fixed ${filePath}`);
        }
    });
});
