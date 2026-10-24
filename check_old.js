const fs = require('fs');
const path = require('path');
const baseDir = 'd:\\\\ISI mail templates industry\\\\Templates_Extracted';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory() && file !== 'node_modules' && !file.startsWith('.')) {
            results = results.concat(walk(fullPath));
        } else if (file.endsWith('.html')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk(baseDir);
files.forEach(f => {
    const text = fs.readFileSync(f, 'utf8');
    if (text.match(/src="[^"]*assets\/b[1-6]\.png"/)) {
        console.log('Found old header in: ' + f);
    }
});
console.log('Check complete.');
