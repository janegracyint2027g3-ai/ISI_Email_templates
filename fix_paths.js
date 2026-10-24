const fs = require('fs');
const path = require('path');

const baseDir = __dirname;

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory() && file !== 'assets' && file !== 'node_modules' && !file.startsWith('.')) {
            results = results.concat(walk(fullPath));
        } else if (file.endsWith('.html') && dir !== baseDir) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk(baseDir);
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    if (content.includes('src="assets/')) {
        content = content.replace(/src="assets\//g, 'src="../assets/');
        modified = true;
    }
    
    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
    }
});
console.log('Fixed relative asset paths in ' + changedCount + ' files.');
