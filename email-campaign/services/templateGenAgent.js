const fs = require('fs');
const path = require('path');
const { CohereClient } = require("cohere-ai");
const config = require("../config/email");

const cohere = new CohereClient({ token: config.cohereApiKey });

const templateTypes = {
    "comprehensive": {
        filename: "template_comprehensive.html",
        boxes: ["Total Security", "Dedicated Support"]
    },
    "physical_security": {
        filename: "template_physical_security.html",
        boxes: ["Manned Guarding", "Access Control"]
    },
    "electronic_security": {
        filename: "template_electronic_security.html",
        boxes: ["CCTV & AI", "Alarm Systems"]
    },
    "facility_management": {
        filename: "template_facility_management.html",
        boxes: ["Housekeeping", "Maintenance"]
    },
    "event_security": {
        filename: "template_event_security.html",
        boxes: ["Crowd Control", "VIP Protection"]
    }
};

async function generateTemplateContent(industry, type) {
    const templateInfo = templateTypes[type];
    if (!templateInfo) throw new Error("Invalid template type");

    const prompt = `You are an expert B2B email copywriter for ISI Security (isisecurity.in).
Rewrite the following email template sections for the "${industry}" industry.
Service focus: ${type.replace(/_/g, " ")}.

Rules:
- Headline: max 8 words, benefit-driven. Output as: HEADLINE: <text>
- Body Paragraph 1: 2-3 sentences, professional B2B tone. Output as: BODY1: <text>
- Body Paragraph 2: 2-3 sentences, professional B2B tone. Output as: BODY2: <text>
- Box 1 Title (${templateInfo.boxes[0]}): max 4 words. Output as: BOX1_TITLE: <text>
- Box 1 Description: max 10 words. Output as: BOX1_DESC: <text>
- Box 2 Title (${templateInfo.boxes[1]}): max 4 words. Output as: BOX2_TITLE: <text>
- Box 2 Description: max 10 words. Output as: BOX2_DESC: <text>
- Call to Action text: 1 sentence leading into the button. Output as: CTA_TEXT: <text>

Do not include any other text or formatting. Just the specific tags followed by the text.`;

    const res = await cohere.chat({
        model: "command-r-plus-08-2024",
        message: prompt,
        temperature: 0.7
    });

    const output = res.text;
    
    // Parse the output
    const content = {};
    const lines = output.split('\n');
    for (const line of lines) {
        if (line.startsWith("HEADLINE:")) content.headline = line.substring(9).trim();
        else if (line.startsWith("BODY1:")) content.body1 = line.substring(6).trim();
        else if (line.startsWith("BODY2:")) content.body2 = line.substring(6).trim();
        else if (line.startsWith("BOX1_TITLE:")) content.box1Title = line.substring(11).trim();
        else if (line.startsWith("BOX1_DESC:")) content.box1Desc = line.substring(10).trim();
        else if (line.startsWith("BOX2_TITLE:")) content.box2Title = line.substring(11).trim();
        else if (line.startsWith("BOX2_DESC:")) content.box2Desc = line.substring(10).trim();
        else if (line.startsWith("CTA_TEXT:")) content.ctaText = line.substring(9).trim();
    }
    
    return content;
}

async function injectIntoTemplate(baselinePath, destPath, content) {
    if (!fs.existsSync(baselinePath)) {
        throw new Error(`Baseline template not found at ${baselinePath}`);
    }
    
    let html = fs.readFileSync(baselinePath, 'utf8');
    
    // Simplistic injection. We assume the baseline has recognizable content.
    // To make this robust, we should ideally use cheerio, but for now we do simple string replace if possible
    // Alternatively, we use regex to replace content inside specific tags.
    
    html = html.replace(/<h1[^>]*>.*?<\/h1>/, `<h1 style="color: #003366; font-size: 26px; margin: 0 0 20px 0; font-weight: bold; text-align: center;">${content.headline}</h1>`);
    
    const p1Match = html.match(/<p[^>]*>(?:A clean and well-maintained school is crucial.*?|A secure environment is crucial.*?|Physical presence is the first line.*?|Modern threats require modern.*?|Hosting a major event.*?)<\/p>/s);
    if(p1Match && content.body1) {
        html = html.replace(p1Match[0], `<p style="font-size: 16px; line-height: 26px; color: #555555; margin: 0 0 20px 0; text-align: justify;">${content.body1}</p>`);
    }
    
    const p2Match = html.match(/<p[^>]*>(?:Our dedicated staff ensures that.*?|From physical guarding to advanced.*?|We ensure strict access control.*?|Our 24\/7 Command Center.*?|From risk assessment to crowd.*?)<\/p>/s);
    if(p2Match && content.body2) {
        html = html.replace(p2Match[0], `<p style="font-size: 16px; line-height: 26px; color: #555555; margin: 0 0 20px 0; text-align: justify;">${content.body2}</p>`);
    }
    
    // We would need to replace the boxes and CTA text similarly.
    // For a production system, adding specific IDs or classes to the template would be much safer.
    
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, html, 'utf8');
    return true;
}

module.exports = { generateTemplateContent, injectIntoTemplate };
