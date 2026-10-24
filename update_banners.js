const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const assetsDir = path.join(baseDir, 'assets');

const HEADERS = ['H1 (1).png', 'H2 (1).png', 'H3 (1).png', 'H4 (1).png', 'H5 (1).png'];
const FOOTERS = ['f1.png', 'f2.png', 'f3.png', 'f4.png'];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory() && file !== 'assets' && file !== 'node_modules' && !file.startsWith('.')) {
            results = results.concat(walk(fullPath));
        } else if (file.endsWith('.html')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk(baseDir);
let changedCount = 0;

files.forEach((file, index) => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Determine header based on filename
    const basename = path.basename(file).toLowerCase();
    let headerName = HEADERS[0];
    
    if (basename.includes('comprehensive')) headerName = HEADERS[0];
    else if (basename.includes('physical')) headerName = HEADERS[1];
    else if (basename.includes('electronic')) headerName = HEADERS[2];
    else if (basename.includes('facility')) headerName = HEADERS[3];
    else if (basename.includes('event')) headerName = HEADERS[4];
    else {
        // template1, template2, etc.
        const numMatch = basename.match(/template(\d+)/);
        if (numMatch) {
            const num = parseInt(numMatch[1], 10);
            headerName = HEADERS[(num - 1) % 5];
        }
    }

    // Determine footer (just round robin)
    const footerName = FOOTERS[index % FOOTERS.length];

    // Replace header src
    // Look for src="assets/..." or src="../assets/..." where ... is bX.png or HX.png
    // The easiest way is to use a regex matching the img tag with alt="Header Banner"
    const newContent = content.replace(/(<img[^>]*alt="Header Banner"[^>]*src=")([^"]+)(")/, (match, p1, p2, p3) => {
        modified = true;
        // Keep the prefix (assets/ or ../assets/) but replace the filename
        const prefix = p2.substring(0, p2.lastIndexOf('/') + 1);
        return p1 + prefix + headerName + p3;
    }).replace(/(<img[^>]*alt="ISI Security Head Office &amp; Contact Details"[^>]*src=")([^"]+)(")/, (match, p1, p2, p3) => {
        modified = true;
        const prefix = p2.substring(0, p2.lastIndexOf('/') + 1);
        return p1 + prefix + footerName + p3;
    });

    if (modified) {
        fs.writeFileSync(file, newContent, 'utf8');
        changedCount++;
    }
});

console.log('Fixed banners in ' + changedCount + ' files.');
