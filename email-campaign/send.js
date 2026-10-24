require("dotenv").config();
const fs = require("fs");
const path = require("path");

const contentAgent = require("./services/contentAgent");
const personalizationAgent = require("./services/personalizationAgent");
const icpAgent = require("./services/icpAgent");
const websitePersonalizationAgent = require("./services/websitePersonalizationAgent");
const { renderTemplateForLead } = require("./services/templateService");
const { sendEmail, isValidEmail } = require("./services/emailService");

const EXISTING_CSV = path.join(__dirname, "data", "existing_customers.csv");
const NEW_CSV      = path.join(__dirname, "data", "new_customers.csv");
const LOG_PATH     = path.join(__dirname, "logs", "sent-log.json");

// ── Parse CSV ─────────────────────────────────
function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const cols = line.split(",").map(c => c.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cols[i] || ""; });
    return obj;
  }).filter(lead => lead.email && lead.name);
}

// ── Log helper ────────────────────────────────
function appendLog(entry) {
  let logs = [];
  try {
    if (fs.existsSync(LOG_PATH)) {
      logs = JSON.parse(fs.readFileSync(LOG_PATH, "utf8") || "[]");
    }
  } catch { logs = []; }
  logs.push(entry);
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.writeFileSync(LOG_PATH, JSON.stringify(logs, null, 2));
}

// ── Process one lead ──────────────────────────
async function processLead(lead) {
  try {
    if (!isValidEmail(lead.email)) throw new Error(`Invalid email: ${lead.email}`);

    console.log(`\n----------------------------------------`);
    console.log(`Processing lead: ${lead.name} (${lead.email})`);

    console.log(`  → Invoking ICP Agent...`);
    const icp = await icpAgent.classify(lead);
    lead.industry = icp.industry;
    lead.role = icp.role;
    lead.type = icp.type;
    
    // We update the template selection to use the one from ICP agent
    // To do this we might need to patch renderTemplateForLead or pass it down.
    // Assuming renderTemplateForLead can take templateFile in lead.
    lead.templateFile = icp.templateFile;

    const label = lead.type === "new" ? "Promotional Email" : "B2B Client Email";
    console.log(`  [ICP Output] Industry: ${lead.industry} | Role: ${lead.role} | Type: ${lead.type}`);

    console.log(`  → Invoking Cohere Content Intelligence Engine...`);
    let websiteHook = null;
    if (lead.website) {
      websiteHook = await websitePersonalizationAgent.generate(lead.website, lead);
    }

    const { generateEmailContent } = require("./services/cohereService");
    const genResult = await generateEmailContent(lead);
    const agentContent = genResult.content;
    if (websiteHook) {
      agentContent.hook = websiteHook;
    }

    console.log(`  [AI Generated Subject] "${agentContent.subject}"`);
    console.log(`  [AI Quality Validation] Status: ${genResult.validation.isValid ? "PASSED" : "FLAGGED"}`);

    const { subject, html, templateUsed, attachments } = renderTemplateForLead(lead, agentContent);
    console.log(`  ✓ Rendered: ${templateUsed}`);

    await sendEmail({ to: lead.email, subject, html, attachments });
    console.log(`  ✓ ${label} processed successfully`);


    appendLog({
      email: lead.email,
      name: lead.name,
      type: lead.type,
      industry: lead.industry,
      subject,
      templateUsed,
      status: "sent",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`  ✗ Failed for ${lead.name} <${lead.email}>: ${err.message}`);
    appendLog({
      email: lead.email,
      name: lead.name,
      type: lead.type,
      industry: lead.industry,
      status: "failed",
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// ── Main ──────────────────────────────────────
async function main() {
  const existingLeads = parseCSV(EXISTING_CSV);
  const newLeads      = parseCSV(NEW_CSV);
  const allLeads      = [...existingLeads, ...newLeads];

  if (allLeads.length === 0) {
    console.log("No leads found in existing_customers.csv or new_customers.csv");
    process.exit(0);
  }

  const config = require("./config/email");

  console.log(`\n========================================`);
  console.log(` FULL ISI SECURITY EMAIL CAMPAIGN`);
  console.log(` Mode               : ${config.dryRun ? "🛡️ DRY-RUN / PREVIEW (No real emails sent)" : "🚀 LIVE SENDING"}`);
  console.log(` Model              : ${config.cohereModel}`);
  console.log(` Existing customers : ${existingLeads.length}`);
  console.log(` New customers      : ${newLeads.length}`);
  console.log(` Total              : ${allLeads.length} email(s)`);
  console.log(`========================================`);


  for (const lead of allLeads) {
    await processLead(lead);
  }

  console.log(`\n----------------------------------------`);
  console.log("✓ Full Campaign Completed Successfully");
}

main().catch(e => {
  console.error("Fatal error:", e.message);
  process.exit(1);
});
