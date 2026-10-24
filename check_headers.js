const fs = require('fs');
const files = [
  'd:/ISI mail templates industry/Templates_Extracted/promotionaltemplate.html',
  'd:/ISI mail templates industry/Templates_Extracted/template1.html',
  'd:/ISI mail templates industry/Templates_Extracted/bfsi_industry/template_comprehensive.html'
];
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const hMatch = content.match(/<img[^>]*alt="Header Banner"[^>]*src="([^"]+)"/);
  console.log(f + ' -> ' + (hMatch ? hMatch[1] : 'No Header Match'));
});
