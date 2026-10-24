const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const indexFile = path.join(baseDir, 'index.html');

const industries = [
    { id: "bfsi_industry", name: "BFSI (Banking & Finance)", icon: "🏦" },
    { id: "manufacturing_industry", name: "Manufacturing & Industrial", icon: "🏭" },
    { id: "education_industry", name: "Education", icon: "🏫" },
    { id: "hospitality_industry", name: "Hospitality & Events", icon: "🏨" },
    { id: "healthcare_industry", name: "Healthcare", icon: "🏥" },
    { id: "logistics_industry", name: "Logistics & Transportation", icon: "🚚" },
    { id: "it_ites_industry", name: "IT / ITES & GCC", icon: "💻" },
    { id: "aerospace_industry", name: "Aerospace", icon: "✈️" },
    { id: "retail_industry", name: "Retail", icon: "🛍️" },
    { id: "smart_cities_industry", name: "Smart Cities", icon: "🏙️" },
    { id: "construction_industry", name: "Construction", icon: "🏗️" }
];

const generalTemplates = [
    { file: "promotionaltemplate.html", name: "Promotional Offer" },
    { file: "template1.html", name: "Enterprise Protection" },
    { file: "template2.html", name: "Secure Your Future" },
    { file: "template3.html", name: "Comprehensive Solutions" },
    { file: "template4.html", name: "Implementation Process" },
    { file: "template5.html", name: "Specialized Solutions" },
    { file: "template6.html", name: "Enterprise Transformation" },
    { file: "template7.html", name: "Security By the Numbers" },
    { file: "template8.html", name: "Upgrade Status Quo" },
    { file: "template9.html", name: "FAQ & Support" },
    { file: "template10.html", name: "Secure Sentinel Newsletter" },
    { file: "template11.html", name: "Important Security Alert" },
    { file: "template12.html", name: "Elite Global Protection" }
];

const templateTypes = {
    "template_comprehensive.html": "Comprehensive",
    "template_physical_security.html": "Physical Security",
    "template_electronic_security.html": "Electronic Security",
    "template_facility_management.html": "Facility Management",
    "template_event_security.html": "Event Security",
    "template_campus_security.html": "Campus Security"
};

function buildSidebar() {
    let html = `
            <!-- INTELLIGENCE EVALUATION REPORT -->
            <div class="section-label">Audit & Intelligence</div>
            <ul class="general-list" style="margin-bottom: 8px;">
                <li><button onclick="loadTemplate('preview_report.html','Intelligence Dashboard','Audit', this)" style="background: rgba(74, 144, 217, 0.18); color: #60a5fa; font-weight: bold; border: 1px solid rgba(74, 144, 217, 0.3);">📊 Intelligence Evaluation Dashboard</button></li>
            </ul>

            <div class="divider"></div>
            <!-- GENERAL TEMPLATES -->
            <div class="section-label">General Templates</div>
            <ul class="general-list" id="generalList">
`;

    for (const t of generalTemplates) {
        if (fs.existsSync(path.join(baseDir, t.file))) {
            html += `                <li><button onclick="loadTemplate('${t.file}','${t.name}','General', this)">${t.name}</button></li>\n`;
        }
    }

    html += `            </ul>\n\n            <div class="divider"></div>\n            <div class="section-label">Industry Templates</div>\n\n`;

    for (const ind of industries) {
        const indDir = path.join(baseDir, ind.id);
        if (!fs.existsSync(indDir)) continue;

        html += `            <!-- ${ind.name} -->
            <div class="industry-group" data-industry="${ind.id}">
                <button class="industry-toggle" onclick="toggleGroup(this)">
                    <span class="ind-icon">${ind.icon}</span>
                    <span class="ind-name">${ind.name}</span>
                    <span class="arrow">▶</span>
                </button>
                <div class="industry-templates">
`;
        
        const files = fs.readdirSync(indDir).filter(f => f.endsWith('.html'));
        for (const f of files) {
            const prettyName = templateTypes[f] || f.replace('.html', '').replace(/_/g, ' ');
            const category = ind.name.split(' ')[0]; // short name
            html += `                    <button class="template-btn" onclick="loadTemplate('${ind.id}/${f}','${prettyName}','${category}', this)">${prettyName}</button>\n`;
        }
        
        html += `                </div>\n            </div>\n\n`;
    }

    return html;
}

function updateIndex() {
    if (!fs.existsSync(indexFile)) {
        console.error("index.html not found");
        return;
    }

    let content = fs.readFileSync(indexFile, 'utf8');
    
    const startTag = '<nav class="sidebar-nav" id="sidebarNav">';
    const endTag = '</nav>';
    
    const startIndex = content.indexOf(startTag);
    const endIndex = content.indexOf(endTag, startIndex);
    
    if (startIndex !== -1 && endIndex !== -1) {
        const before = content.substring(0, startIndex + startTag.length);
        const after = content.substring(endIndex);
        
        const newSidebar = buildSidebar();
        
        fs.writeFileSync(indexFile, before + '\n' + newSidebar + after, 'utf8');
        console.log("index.html updated successfully.");
    } else {
        console.error("Could not find sidebar-nav bounds in index.html");
    }
}

updateIndex();
