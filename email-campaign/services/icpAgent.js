const { CohereClient } = require("cohere-ai");
const config = require("../config/email");

const cohere = new CohereClient({ token: config.cohereApiKey });

const INDUSTRIES = [
    "bfsi", "manufacturing", "education", "hospitality", "healthcare", 
    "logistics", "it_ites", "aerospace", "retail", "smart_cities", "construction"
];

async function classify(lead) {
    let industry = lead.industry ? lead.industry.toLowerCase() : "";
    let role = lead.role ? lead.role : "";
    let customerType = lead.type || "new";

    // 1. Detect Industry if missing
    if (!industry || !INDUSTRIES.includes(industry)) {
        try {
            const prompt = `You are a B2B lead classifier. Given the prospect's company name, email domain, or title, classify their industry into EXACTLY ONE of the following:
${INDUSTRIES.join(", ")}. 
If it doesn't clearly fit, return "general".
Prospect Info:
Name: ${lead.name}
Company: ${lead.company || "Unknown"}
Email: ${lead.email}
Output ONLY the raw industry string.`;
            
            const res = await cohere.chat({
                model: "command-r-plus-08-2024",
                message: prompt,
                temperature: 0.1
            });
            const predicted = res.text.trim().toLowerCase();
            if (INDUSTRIES.includes(predicted)) {
                industry = predicted;
            } else {
                industry = "general";
            }
        } catch (err) {
            console.warn(`  ⚠ Industry classification failed: ${err.message}`);
            industry = "general";
        }
    }

    // 2. Detect Role if missing
    if (!role) {
        try {
            const prompt = `You are a B2B role classifier. Given the prospect's name/title/email, classify their role into EXACTLY ONE of the following categories:
"C-Suite", "Operations", "Facility Manager", "Procurement", "HR/Admin".
If unknown, return "Operations".
Prospect Info:
Name: ${lead.name}
Company: ${lead.company || "Unknown"}
Email: ${lead.email}
Output ONLY the raw role category string.`;
            
            const res = await cohere.chat({
                model: "command-r-plus-08-2024",
                message: prompt,
                temperature: 0.1
            });
            role = res.text.trim();
        } catch (err) {
            console.warn(`  ⚠ Role classification failed: ${err.message}`);
            role = "Operations";
        }
    }

    // 3. Select Template
    let templateFile = "promotionaltemplate.html"; // default
    if (customerType === "existing") {
        templateFile = "template_facility_management.html";
    } else if (customerType === "lapsed") {
        templateFile = "template_comprehensive.html";
    } else {
        // new
        if (role === "C-Suite") {
            templateFile = "template_comprehensive.html";
        } else if (role === "IT/Facilities" || role === "Facility Manager") {
            templateFile = "template_electronic_security.html";
        } else {
            templateFile = "template_physical_security.html";
        }
    }

    if (industry !== "general") {
        templateFile = `${industry}_industry/${templateFile}`;
    }

    return {
        industry,
        role,
        type: customerType,
        templateFile
    };
}

module.exports = { classify };
