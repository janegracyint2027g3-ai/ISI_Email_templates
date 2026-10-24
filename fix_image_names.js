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
let count = 0;

files.forEach(f => {
    let text = fs.readFileSync(f, 'utf8');
    let modified = false;
    
    // Replace 'H1 (1).png' -> 'H1.png'
    for (let i = 1; i <= 6; i++) {
        const oldStr = `H${i} (1).png`;
        const newStr = `H${i}.png`;
        if (text.includes(oldStr)) {
            // We use replaceAll or just simple string replacement if it only appears once
            text = text.split(oldStr).join(newStr);
            modified = true;
        }
    }
    
    // Also URL encoding if it was present, just in case
    for (let i = 1; i <= 6; i++) {
        const oldStr = `H${i}%20(1).png`;
        const newStr = `H${i}.png`;
        if (text.includes(oldStr)) {
            text = text.split(oldStr).join(newStr);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(f, text, 'utf8');
        count++;
    }
});

console.log('Fixed spaces in image names in ' + count + ' files.');
