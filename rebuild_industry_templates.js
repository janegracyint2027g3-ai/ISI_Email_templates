const fs = require('fs');
const path = require('path');

const industries = [
    { id: "bfsi", name: "BFSI (Banking & Finance)", title: "Bank & Financial Institution" },
    { id: "manufacturing", name: "Manufacturing & Industrial", title: "Manufacturing Facility" },
    { id: "education", name: "Education", title: "School & Campus" },
    { id: "hospitality", name: "Hospitality & Events", title: "Hotel & Resort" },
    { id: "healthcare", name: "Healthcare", title: "Hospital & Medical Facility" },
    { id: "logistics", name: "Logistics & Transportation", title: "Logistics Hub" },
    { id: "it_ites", name: "IT/ITES & GCC", title: "IT Park & Tech Hub" },
    { id: "aerospace", name: "Aerospace", title: "Aerospace Facility" },
    { id: "retail", name: "Retail", title: "Retail Mall & Store" },
    { id: "smart_cities", name: "Smart Cities", title: "Smart City Infrastructure" },
    { id: "construction", name: "Construction", title: "Construction Site" }
];

const templateTypes = [
    { 
        id: "general", 
        filename: "template_comprehensive.html",
        baseline: "template1.html",
        headline: "Comprehensive Security & Intelligence Services.",
        body1: "A secure environment is crucial for uninterrupted operations. ISI offers top-tier security services designed specifically for {name}.",
        body2: "From physical guarding to advanced electronic surveillance, we provide end-to-end protection so you can focus on your core business."
    },
    { 
        id: "physical", 
        filename: "template_physical_security.html",
        baseline: "template2.html",
        headline: "Robust Physical Security for Your {title}.",
        body1: "Physical presence is the first line of defense. Our highly trained security personnel are equipped to handle the specific challenges of {name}.",
        body2: "We ensure strict access control, regular patrols, and immediate threat neutralization to keep your premises safe."
    },
    { 
        id: "electronic", 
        filename: "template_electronic_security.html",
        baseline: "template3.html",
        headline: "Advanced Electronic Security Systems.",
        body1: "Modern threats require modern solutions. We deploy state-of-the-art electronic security tailored for {name}.",
        body2: "Our 24/7 Command Center platform utilizes AI-powered cameras, intrusion detection, and automated alerts."
    },
    { 
        id: "facility", 
        filename: "template_facility_management.html",
        baseline: "template4.html",
        headline: "Clean & Maintained {title} Spaces.",
        body1: "A clean and well-maintained {title} is crucial for health and productivity. Beyond physical security, ISI offers top-tier Facility Management services tailored to {name}.",
        body2: "Our dedicated staff ensures that your facilities are spotless, safe, and ready for operations every day."
    },
    { 
        id: "event", 
        filename: "template_event_security.html",
        baseline: "template5.html",
        headline: "Specialized Security for {title} Events.",
        body1: "Hosting a major event or VIP visit requires specialized planning. We offer comprehensive event security for {name}.",
        body2: "From risk assessment to crowd management and executive protection, we ensure your special events go off without a hitch."
    }
];

const baseDir = __dirname;

function replaceContent(html, content) {
    // Replace H1 text but keep style
    let result = html.replace(/(<h1[^>]*>).*?(<\/h1>)/, `$1${content.headline}$2`);
    
    // Replace the first and second paragraph after Dear Valued Partner
    // The structure usually has <p>Dear Valued Partner,</p> then the next <p>s are the bodies
    
    const pMatches = [...result.matchAll(/<p[^>]*>.*?<\/p>/gs)];
    
    // Find "Dear Valued Partner,"
    let greetingIndex = -1;
    for (let i = 0; i < pMatches.length; i++) {
        if (pMatches[i][0].includes('Dear Valued Partner')) {
            greetingIndex = i;
            break;
        }
    }
    
    if (greetingIndex !== -1 && greetingIndex + 2 < pMatches.length) {
        const p1 = pMatches[greetingIndex + 1][0];
        const p2 = pMatches[greetingIndex + 2][0];
        
        const newP1 = p1.replace(/(<p[^>]*>).*?(<\/p>)/s, `$1${content.body1}$2`);
        const newP2 = p2.replace(/(<p[^>]*>).*?(<\/p>)/s, `$1${content.body2}$2`);
        
        result = result.replace(p1, newP1);
        result = result.replace(p2, newP2);
    }
    
    return result;
}

industries.forEach(ind => {
    const indDir = path.join(baseDir, `${ind.id}_industry`);
    if (!fs.existsSync(indDir)) fs.mkdirSync(indDir, { recursive: true });

    templateTypes.forEach(type => {
        const baselinePath = path.join(baseDir, type.baseline);
        if (!fs.existsSync(baselinePath)) return;
        
        const baselineHtml = fs.readFileSync(baselinePath, 'utf8');
        
        const content = {
            headline: type.headline.replace('{title}', ind.title).replace('{name}', ind.name),
            body1: type.body1.replace('{title}', ind.title).replace('{name}', ind.name),
            body2: type.body2.replace('{title}', ind.title).replace('{name}', ind.name)
        };
        
        const newHtml = replaceContent(baselineHtml, content);
        
        const destPath = path.join(indDir, type.filename);
        fs.writeFileSync(destPath, newHtml, 'utf8');
        console.log(`Generated ${destPath} using ${type.baseline}`);
    });
});
