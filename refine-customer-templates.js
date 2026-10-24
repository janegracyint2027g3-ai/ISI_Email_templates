const fs = require("node:fs");
const path = require("node:path");

const industries = {
  aerospace: {
    label: "Aerospace operations and MRO leaders",
    context: "Aerospace sites coordinate controlled access around hangars, maintenance areas, and high-value equipment.",
    pain: "Gaps between access procedures and shift handovers can make site-level accountability difficult.",
    kpi: "access exceptions and incident response time",
    location: "your aerospace site"
  },
  bfsi: {
    label: "Banking operations, security, and facilities leaders",
    context: "Branch, office, and cash-handling operations depend on consistent visitor and staff access controls.",
    pain: "Different site routines can make it harder to maintain clear oversight across locations.",
    kpi: "access exceptions and incident response time",
    location: "your branches and offices"
  },
  construction: {
    label: "Construction project and site operations leaders",
    context: "Active project sites manage changing contractor access, deliveries, equipment, and work areas.",
    pain: "Unclear gate procedures or handovers can make it harder to track people and materials on site.",
    kpi: "gate-pass exceptions and incident response time",
    location: "your project sites"
  },
  education: {
    label: "Campus operations, facilities, and student-safety leaders",
    context: "Campus teams balance student and staff safety with visitors, contractors, and daily campus activity.",
    pain: "Inconsistent visitor and after-hours access routines can add work for campus operations teams.",
    kpi: "visitor access exceptions and incident response time",
    location: "your campus"
  },
  healthcare: {
    label: "Hospital operations, security, and facilities leaders",
    context: "Hospital teams manage patient, staff, vendor, and visitor movement across clinical areas and shifts.",
    pain: "Unclear access and incident handoffs can put extra coordination demands on busy care teams.",
    kpi: "visitor access exceptions and incident response time",
    location: "your facility"
  },
  hospitality: {
    label: "Hotel, venue, and guest-operations leaders",
    context: "Hospitality teams need guest-facing operations to run smoothly while managing staff, vendors, and event visitors.",
    pain: "Busy arrival periods and inconsistent handovers can make it harder to keep service and site oversight aligned.",
    kpi: "incident response time and visitor access exceptions",
    location: "your property or venue"
  },
  it_ites: {
    label: "IT campus, workplace, and security leaders",
    context: "Technology campuses coordinate employee, visitor, and vendor access across office and operational spaces.",
    pain: "Access routines that vary by building or shift can make oversight harder for workplace teams.",
    kpi: "access exceptions and incident response time",
    location: "your campus"
  },
  logistics: {
    label: "Warehouse, distribution, and supply-chain operations leaders",
    context: "Distribution sites coordinate vehicle arrivals, contractor access, loading areas, and inventory movement.",
    pain: "Gaps in gate checks or shift handovers can make site activity harder to reconcile.",
    kpi: "gate exceptions and incident response time",
    location: "your distribution sites"
  },
  manufacturing: {
    label: "Plant, operations, and security leaders",
    context: "Manufacturing sites coordinate workforce, contractor, vehicle, and material movement around production.",
    pain: "Access or shift-handover gaps can create extra work for teams responsible for site continuity.",
    kpi: "access exceptions and incident response time",
    location: "your plant"
  },
  retail: {
    label: "Retail operations, loss-prevention, and facilities leaders",
    context: "Retail teams balance a smooth customer experience with staff, delivery, and stockroom access.",
    pain: "Inconsistent floor and back-of-house routines can make incidents and stock discrepancies harder to review.",
    kpi: "incident frequency and stock-discrepancy trends",
    location: "your stores and distribution sites"
  },
  smart_cities: {
    label: "Smart-city, public-infrastructure, and SPV operations leaders",
    context: "Public infrastructure teams coordinate access and incident handling across distributed civic assets.",
    pain: "Different local procedures can make service coverage and incident ownership harder to track.",
    kpi: "incident response time and site-coverage exceptions",
    location: "your civic assets"
  }
};

const services = {
  template_comprehensive: {
    subject: "Reviewing Site Security Priorities",
    focus: "physical guarding, access procedures, and electronic security",
    pain: "When these controls are managed separately, it can be difficult to see where ownership or handovers need attention.",
    cta: "Would a brief exchange about your current site-security priorities be useful?"
  },
  template_physical_security: {
    subject: "Reviewing Site Coverage",
    focus: "guard coverage, access checks, and shift handovers",
    pain: "Unclear post responsibilities or shift handovers can leave operations teams with gaps to investigate.",
    cta: "Would it be useful to compare your current coverage and handover approach?"
  },
  template_electronic_security: {
    subject: "Reviewing Security Alerts",
    focus: "CCTV monitoring, access controls, and incident escalation",
    pain: "Alerts are most useful when the right person can review and route them through a clear response process.",
    cta: "Would a short discussion about your alert-review process be useful?"
  },
  template_facility_management: {
    subject: "Reviewing Site Operations",
    focus: "facility upkeep, service handovers, and site coordination",
    pain: "Unclear responsibilities between service teams can make recurring issues harder to resolve.",
    cta: "Would it help to compare how your teams handle site-service handovers?"
  },
  template_event_security: {
    subject: "Planning for Event Readiness",
    focus: "event access, guest movement, and incident coordination",
    pain: "When arrivals, venue access, and escalation roles are not aligned, event teams have more to coordinate in real time.",
    cta: "Would a brief exchange about your next event's access plan be useful?"
  },
  template_campus_security: {
    subject: "Reviewing Campus Access",
    focus: "campus entry, visitor procedures, and after-hours coverage",
    pain: "Unclear ownership between campus teams can make visitor and after-hours exceptions harder to follow up.",
    cta: "Would a brief discussion about your campus access routines be useful?"
  }
};

const generalTemplates = {
  promotionaltemplate: { subject: "Reviewing Your Site Security", focus: "physical guarding, access procedures, and electronic security", pain: "Managing these controls across different teams can make responsibilities and handovers harder to track.", kpi: "access exceptions and incident response time", cta: "Would a brief exchange about your current site-security priorities be useful?" },
  template1: { subject: "Reviewing Site Security Priorities", focus: "physical guarding, access procedures, and electronic security", pain: "When these controls are managed separately, it can be difficult to see where ownership or handovers need attention.", kpi: "access exceptions and incident response time", cta: "Would a brief exchange about your current site-security priorities be useful?" },
  template2: { subject: "Reviewing Physical Coverage", focus: "guard coverage, access checks, and shift handovers", pain: "Unclear post responsibilities or shift handovers can leave operations teams with gaps to investigate.", kpi: "coverage exceptions and incident response time", cta: "Would it be useful to compare your current coverage and handover approach?" },
  template3: { subject: "Reviewing Security Alerts", focus: "CCTV monitoring, access controls, and incident escalation", pain: "Alerts are most useful when the right person can review and route them through a clear response process.", kpi: "alert review and incident response time", cta: "Would a short discussion about your alert-review process be useful?" },
  template4: { subject: "Reviewing Site Operations", focus: "facility upkeep, service handovers, and site coordination", pain: "Unclear responsibilities between service teams can make recurring issues harder to resolve.", kpi: "open maintenance issues and handover time", cta: "Would it help to compare how your teams handle site-service handovers?" },
  template5: { subject: "Planning for Event Readiness", focus: "event access, guest movement, and incident coordination", pain: "When arrivals, venue access, and escalation roles are not aligned, event teams have more to coordinate in real time.", kpi: "access exceptions and incident response time", cta: "Would a brief exchange about your next event's access plan be useful?" },
  template6: { subject: "Reviewing Operational Coverage", focus: "site coverage, incident escalation, and service coordination", pain: "Unclear ownership across teams can make security issues harder to follow through.", kpi: "coverage exceptions and incident response time", cta: "Would it be useful to compare your current site-coverage process?" },
  template7: { subject: "Reviewing Security Indicators", focus: "site coverage, access controls, and incident reporting", pain: "Without a consistent view of site-level exceptions, it can be difficult to prioritize follow-up.", kpi: "access exceptions and incident response time", cta: "Would a short exchange about the measures your team reviews be useful?" },
  template8: { subject: "Reviewing Current Site Controls", focus: "physical guarding, access procedures, and electronic security", pain: "Controls that do not match current site routines can create avoidable coordination work.", kpi: "access exceptions and incident response time", cta: "Would it be useful to compare your current site controls?" },
  template9: { subject: "A Question on Site Coverage", focus: "guard coverage, access checks, and shift handovers", pain: "Unclear handovers can make it harder to understand how site issues are reviewed and resolved.", kpi: "coverage exceptions and incident response time", cta: "Would a brief discussion about your current process be useful?" },
  template10: { subject: "Reviewing Site Security Updates", focus: "site coverage, incident reporting, and operational handovers", pain: "As site routines change, older processes may not give teams a consistent view of exceptions.", kpi: "coverage exceptions and incident response time", cta: "Would it help to compare the security measures your team reviews?" },
  template11: { subject: "Reviewing Site Incident Readiness", focus: "incident escalation, access procedures, and response ownership", pain: "If escalation roles are unclear, operations teams may find incidents harder to coordinate.", kpi: "incident response time and escalation exceptions", cta: "Would a short discussion about your escalation process be useful?" },
  template12: { subject: "Reviewing Multi-Site Coverage", focus: "site coverage, access procedures, and incident coordination", pain: "Differences between locations can make consistent oversight difficult for regional teams.", kpi: "site-coverage exceptions and incident response time", cta: "Would it be useful to compare how your team reviews multi-site coverage?" }
};

const titleCase = (value) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const escapeHtml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function getCopy(filePath) {
  const name = path.basename(filePath, ".html");
  const folder = path.basename(path.dirname(filePath));
  const industryKey = folder.replace(/_industry$/, "");
  const industry = industries[industryKey];

  if (!industry) {
    const base = generalTemplates[name];
    return base && {
      ...base,
      label: "Enterprise operations, security, and facilities leaders",
      context: "For multi-site organizations, consistent site routines help teams coordinate people, assets, and daily operations.",
      location: "your sites"
    };
  }

  const service = services[name];
  if (!service) return null;
  return {
    ...service,
    label: industry.label,
    context: industry.context,
    pain: `${industry.pain} ${service.pain}`,
    kpi: industry.kpi,
    location: industry.location
  };
}

function createHtml(filePath, copy) {
  const source = fs.readFileSync(filePath, "utf8");
  const color = source.match(/<h1[^>]*style="[^"]*color:\s*(#[\da-fA-F]{3,8})/i)?.[1] || "#123b63";
  const assetPrefix = path.relative(path.dirname(filePath), path.join(__dirname, "assets")).replace(/\\/g, "/") || ".";
  const industryLabel = path.basename(path.dirname(filePath)).replace(/_industry$/, "");
  const audience = copy.label.replace(/ leaders?$/i, "");
  const painSentence = copy.pain;
  const kpiSentence = `A useful impact measure is ${copy.kpi}; reviewing your own baseline can help show where attention is needed without assuming a result.`;
  const timingSentence = "If a site review, renewal, or planning cycle is approaching, it can be a practical time to revisit these controls.";
  const bodySentences = [copy.context, painSentence, kpiSentence, timingSentence, copy.cta];
  const wordCount = bodySentences.join(" ").split(/\s+/).filter(Boolean).length;

  if (wordCount >= 125) {
    throw new Error(`${path.relative(__dirname, filePath)} email body exceeds 124 words (${wordCount}).`);
  }

  const subject = `${copy.subject} | ISI Security`;
  const encodedSubject = encodeURIComponent(subject);
  const message = encodeURIComponent(`Hello ISI Security, I would like to discuss ${copy.focus} for ${copy.location}.`);
  const paragraphs = bodySentences.map((sentence) =>
    `<p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.7;">${escapeHtml(sentence)}</p>`
  ).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(`${copy.subject} for ${audience.toLowerCase()}.`)}">
  <title>${escapeHtml(subject)}</title>
  <style>
    body { margin:0; padding:24px 12px; background:#f1f5f9; font-family:Arial,Helvetica,sans-serif; color:#1e293b; }
    .email { width:100%; max-width:600px; margin:0 auto; background:#fff; border-radius:10px; overflow:hidden; }
    .content { padding:28px 32px; }
    .label { color:${color}; font-size:12px; font-weight:bold; letter-spacing:.5px; text-transform:uppercase; margin:0 0 12px; }
    h1 { margin:0 0 18px; color:${color}; font-size:25px; line-height:1.3; }
    .kpi { margin:18px 0; padding:14px 16px; border-left:4px solid ${color}; background:#f8fafc; color:#334155; font-size:13px; line-height:1.6; }
    .cta { display:inline-block; margin-top:4px; padding:13px 20px; border-radius:5px; background:${color}; color:#fff; font-size:14px; font-weight:bold; text-decoration:none; }
    .footer { padding:20px 24px; background:#f8fafc; color:#64748b; font-size:12px; line-height:1.7; text-align:center; }
    @media(max-width:480px) { body { padding:0; } .email { border-radius:0; } .content { padding:24px 18px; } h1 { font-size:22px; } }
  </style>
</head>
<body>
  <table role="presentation" class="email" cellpadding="0" cellspacing="0" border="0">
    <tr><td><img src="${assetPrefix}/H1.png" alt="ISI Security" width="600" style="display:block;width:100%;height:auto;border:0"></td></tr>
    <tr><td class="content">
      <p class="label">${escapeHtml(audience)}</p>
      <h1>${escapeHtml(copy.subject)}</h1>
      ${paragraphs}
      <div class="kpi"><strong>Impact measure to review:</strong> ${escapeHtml(copy.kpi)}</div>
      <a class="cta" href="mailto:info@isisecurity.in?subject=${encodedSubject}">Reply to discuss site priorities</a>
      <p style="margin:14px 0 0;color:#64748b;font-size:12px;">Prefer WhatsApp? <a href="https://wa.me/917708887878?text=${message}" style="color:${color};">Ask a quick question</a>.</p>
    </td></tr>
    <tr><td class="footer">
      <strong style="color:${color};">Industrial Security &amp; Intelligence (I) Pvt. Ltd.</strong><br>
      ${escapeHtml(copy.focus)}<br>
      <a href="https://www.isisecurity.in" style="color:${color};">isisecurity.in</a> &nbsp;|&nbsp; +91 77088 87878
    </td></tr>
  </table>
</body>
</html>
`;
}

function listTemplateFiles() {
  const files = [];
  for (const entry of fs.readdirSync(__dirname, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.endsWith("_industry")) {
      for (const file of fs.readdirSync(path.join(__dirname, entry.name))) {
        if (file.endsWith(".html")) files.push(path.join(__dirname, entry.name, file));
      }
    }
  }
  for (const file of fs.readdirSync(__dirname)) {
    if (/^(?:promotionaltemplate|template\d+)\.html$/.test(file)) {
      files.push(path.join(__dirname, file));
    }
  }
  return files;
}

let updated = 0;
for (const filePath of listTemplateFiles()) {
  const copy = getCopy(filePath);
  if (!copy) continue;
  fs.writeFileSync(filePath, createHtml(filePath, copy), "utf8");
  updated++;
}
console.log(`Updated ${updated} customer-centric email templates.`);
