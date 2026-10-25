const fs = require("node:fs");
const path = require("node:path");

const industries = {
  aerospace: {
    name: "Aerospace facilities",
    situation: "Aerospace facilities coordinate restricted access around sensitive areas, contractors, maintenance work and high-value assets.",
    pain: "Differences in access checks or shift handovers can make exceptions harder to track across teams.",
    impact: "Unclear ownership may complicate incident follow-up and site reviews.",
    kpi: "restricted-area access exceptions and incident-reporting completeness",
    event: "a facility review, contractor transition or planned site change",
  },
  bfsi: {
    name: "Banking operations",
    situation: "Banks coordinate access across branches, ATMs, offices and cash-handling areas.",
    pain: "When access checks and incident handovers vary by location, operations teams may have less consistent oversight.",
    impact: "Exceptions can be harder to investigate and evidence during internal reviews.",
    kpi: "branch access exceptions and incident-reporting completeness",
    event: "a branch review, audit cycle or vendor renewal",
  },
  construction: {
    name: "Construction sites",
    situation: "Construction sites manage changing contractor access, deliveries, equipment and work areas as projects progress.",
    pain: "Inconsistent gate procedures or after-hours handovers can make people and materials harder to account for.",
    impact: "Unresolved exceptions may add coordination work and complicate site incident reviews.",
    kpi: "gate-pass exceptions and after-hours coverage",
    event: "a project phase change, contractor transition or site review",
  },
  education: {
    name: "Campus operations",
    situation: "Campuses balance student and staff safety with visitor screening, contractor access and after-hours activity.",
    pain: "Different visitor procedures across buildings can make exceptions harder for campus teams to follow up.",
    impact: "Unclear access records may complicate incident review and emergency coordination.",
    kpi: "visitor access exceptions and incident-reporting completeness",
    event: "a term change, campus event or facilities review",
  },
  healthcare: {
    name: "Hospital operations",
    situation: "Hospitals coordinate patient, staff, vendor and visitor movement around clinical and restricted areas.",
    pain: "Unclear access ownership or shift handovers can add coordination demands for busy facility teams.",
    impact: "Exceptions may complicate incident follow-up and continuity across departments.",
    kpi: "restricted-area access exceptions and incident handover completeness",
    event: "a facility review, service transition or planned expansion",
  },
  hospitality: {
    name: "Hospitality and venues",
    situation: "Hotels and venues coordinate guest movement alongside staff, suppliers and event access.",
    pain: "Busy arrivals and changing venue requirements can make access roles and handovers harder to align.",
    impact: "Unclear ownership may add work during incident follow-up and guest-service coordination.",
    kpi: "visitor access exceptions and incident handover completeness",
    event: "an event calendar review, venue change or vendor renewal",
  },
  it_ites: {
    name: "Technology campuses",
    situation: "IT, ITES and GCC campuses coordinate employee, visitor and vendor access across offices and operational spaces.",
    pain: "Procedures that differ by building or shift can make access exceptions harder to review consistently.",
    impact: "Gaps in records may complicate incident follow-up and facility continuity.",
    kpi: "building access exceptions and incident-reporting completeness",
    event: "a new-site opening, access review or vendor transition",
  },
  logistics: {
    name: "Distribution operations",
    situation: "Warehouses and distribution sites coordinate vehicle arrivals, loading areas, contractors and inventory movement.",
    pain: "Gaps in gate checks or shift handovers can make site activity harder to reconcile.",
    impact: "Unresolved exceptions may complicate cargo inquiries and operational reviews.",
    kpi: "vehicle-entry exceptions and incident handover completeness",
    event: "a peak-period plan, site expansion or contract renewal",
  },
  manufacturing: {
    name: "Manufacturing operations",
    situation: "Manufacturing sites coordinate workforce, contractor, vehicle and material movement around production areas.",
    pain: "Inconsistent perimeter checks or shift handovers can make site exceptions harder to investigate.",
    impact: "Unclear incident ownership may add work for teams responsible for production continuity.",
    kpi: "access exceptions and incident-reporting completeness",
    event: "a production change, plant review or contractor transition",
  },
  retail: {
    name: "Retail operations",
    situation: "Retail teams balance customer access with staff, delivery and stockroom movement across stores.",
    pain: "Inconsistent floor and back-of-house procedures can make incidents and stock discrepancies harder to review.",
    impact: "Gaps in follow-up may affect customer safety and leave loss-prevention teams with less context.",
    kpi: "store access exceptions and incident or stock-discrepancy trends",
    event: "a store opening, seasonal plan or coverage review",
  },
  smart_cities: {
    name: "Smart-city operations",
    situation: "Public-infrastructure teams coordinate access and incident ownership across distributed civic assets.",
    pain: "Different local procedures can make coverage and escalation responsibilities harder to track.",
    impact: "Unclear ownership may complicate response coordination and operational reporting.",
    kpi: "site-coverage exceptions and incident handover completeness",
    event: "an infrastructure review, site addition or operating-plan update",
  },
};

const services = {
  template_comprehensive: {
    label: "comprehensive security",
    pain: "When guarding, access procedures and electronic security are managed separately, ownership of exceptions can be less clear.",
    focus: "guarding, access procedures and electronic security",
  },
  template_physical_security: {
    label: "physical security",
    pain: "Unclear post responsibilities, entry checks or shift handovers can make site coverage harder to verify.",
    focus: "guard coverage, entry checks and shift handovers",
  },
  template_electronic_security: {
    label: "electronic security",
    pain: "Camera alerts and access exceptions need clear review and escalation ownership to support consistent follow-up.",
    focus: "CCTV monitoring, access controls and incident escalation",
  },
  template_facility_management: {
    label: "facility management",
    pain: "Unclear ownership of upkeep, contractor access and service handovers can add coordination for site teams.",
    focus: "facility upkeep, service handovers and site coordination",
  },
  template_event_security: {
    label: "event security",
    pain: "Changes in arrivals, venue access or staffing can make event roles and incident coordination harder to align.",
    focus: "event access, guest movement and incident coordination",
  },
  template_campus_security: {
    label: "campus security",
    pain: "Visitor exceptions and after-hours access can be harder to follow up when routines differ across campus buildings.",
    focus: "campus entry, visitor procedures and after-hours coverage",
  },
};

const generalTemplates = {
  promotionaltemplate: {
    headline: "Reviewing Your Site-Security Priorities",
    situation: "Organizations balance daily operations with the need to coordinate people, access and site protection.",
    pain: "When responsibilities differ across teams or locations, security exceptions can be harder to follow through.",
    impact: "That uncertainty may add management work and make incident reviews less straightforward.",
    kpi: "site-coverage exceptions and incident handover completeness",
    event: "a site review, vendor renewal or operational planning cycle",
    solution: "ISI Security's guarding, access-procedure and electronic-security capabilities",
  },
  template1: {
    headline: "Consistent Security Across Locations",
    situation: "Enterprise teams coordinate people, assets and operating routines across sites with different local requirements.",
    pain: "Different access and reporting practices can make it difficult to see where coverage or ownership varies.",
    impact: "Variations may complicate oversight and leave regional teams with more follow-up work.",
    kpi: "site-coverage exceptions and incident-reporting completeness",
    event: "a location review, vendor transition or expansion plan",
    solution: "ISI Security's site-coverage, access-procedure and incident-coordination capabilities",
  },
  template2: {
    headline: "Plan Ahead for Changing Site Needs",
    situation: "Site-security requirements can shift as facilities, workforces and operating schedules change.",
    pain: "Procedures that are not revisited may no longer reflect current access patterns or responsibilities.",
    impact: "A mismatch can make exceptions harder to resolve and continuity harder to coordinate.",
    kpi: "access exceptions and shift-handover completeness",
    event: "a planned site change, new operating schedule or contract review",
    solution: "ISI Security's guarding, access-control and site-coordination capabilities",
  },
  template3: {
    headline: "Connect Physical and Electronic Controls",
    situation: "Organizations often rely on people, access procedures and surveillance to support site security.",
    pain: "When these controls operate in separate workflows, incident ownership and follow-up can be less visible.",
    impact: "Gaps in coordination may complicate investigations and routine site reporting.",
    kpi: "access exceptions and incident-escalation completeness",
    event: "a security assessment, system review or vendor renewal",
    solution: "ISI Security's physical guarding and electronic-security capabilities",
  },
  template4: {
    headline: "Plan a Clear Security Implementation",
    situation: "Security changes often involve site teams, access procedures and day-to-day operating requirements.",
    pain: "Unclear responsibilities during a transition can make coverage and handovers harder to coordinate.",
    impact: "That can add operational work and make it harder to confirm that agreed procedures are in use.",
    kpi: "coverage exceptions and implementation handover completeness",
    event: "a planned service transition, site opening or operating change",
    solution: "ISI Security's guarding, access-procedure and facility-coordination capabilities",
  },
  template5: {
    headline: "Match Security to Site Requirements",
    situation: "Different facilities have distinct access patterns, assets, workforces and operating constraints.",
    pain: "A broad, unchanged approach may leave site-specific responsibilities or exceptions unclear.",
    impact: "Teams may spend more time reconciling local procedures and incident ownership.",
    kpi: "site-specific exceptions and incident-reporting completeness",
    event: "a facility assessment, contract review or change in site use",
    solution: "ISI Security's site protection and risk-assessment capabilities",
  },
  template6: {
    headline: "Align Security With Evolving Operations",
    situation: "Organizations adjusting their operating model may also need to review site access and coverage routines.",
    pain: "New locations, schedules or responsibilities can outpace established security handovers.",
    impact: "Unclear transitions may make service consistency and incident follow-up harder to assess.",
    kpi: "coverage exceptions and cross-site incident handover completeness",
    event: "an expansion, organizational change or service renewal",
    solution: "ISI Security's site-coverage, access-procedure and reporting capabilities",
  },
  template7: {
    headline: "Review the Measures Behind Site Coverage",
    situation: "Operations and security teams use site records to understand coverage, access and incident handling.",
    pain: "Measures tracked differently across locations can make meaningful comparison difficult.",
    impact: "A consistent baseline may help teams prioritize review without assuming a result.",
    kpi: "access exceptions, coverage gaps and incident response time",
    event: "a reporting review, audit cycle or planning period",
    solution: "ISI Security's coverage coordination and incident-reporting capabilities",
  },
  template8: {
    headline: "Check Whether Current Controls Still Fit",
    situation: "Security procedures and equipment should reflect how people and assets move through a site today.",
    pain: "Older routines may not match current access patterns, responsibilities or escalation paths.",
    impact: "A poor fit can create avoidable follow-up and reduce clarity during incident reviews.",
    kpi: "access exceptions and procedure-review findings",
    event: "a security assessment, facility change or contract renewal",
    solution: "ISI Security's site-assessment, guarding and electronic-security capabilities",
  },
  template9: {
    headline: "Questions to Resolve Before a Site Review",
    situation: "A useful security review starts with clear site scope, responsibilities and operating requirements.",
    pain: "Unanswered questions about coverage, reporting or escalation can slow an effective evaluation.",
    impact: "That uncertainty may leave teams comparing services without a shared basis.",
    kpi: "open scope items and incident-escalation ownership",
    event: "a procurement review, vendor renewal or planned assessment",
    solution: "ISI Security's site-security assessment and protection capabilities",
  },
  template10: {
    headline: "Security Topics for Operations Teams",
    situation: "Operational teams regularly review how people, assets and site procedures are coordinated.",
    pain: "Changes in access routines or incident ownership can be easy to miss between formal reviews.",
    impact: "Periodic checks can help surface issues before they become recurring coordination tasks.",
    kpi: "repeat access exceptions and incident handover completeness",
    event: "a routine operations review or upcoming planning cycle",
    solution: "ISI Security's guarding, access-procedure and incident-support capabilities",
  },
  template11: {
    headline: "Review Incident Procedures With Care",
    situation: "When a security notice or incident is reviewed, teams need clear ownership for verification and follow-up.",
    pain: "Unclear escalation paths can make it harder to coordinate information across site teams.",
    impact: "A structured review may help clarify responsibilities without assuming a threat or outcome.",
    kpi: "escalation ownership and incident-reporting completeness",
    event: "a documented incident review or planned response exercise",
    solution: "ISI Security's incident-support, access-control and site-protection capabilities",
  },
  template12: {
    headline: "Coordinate Security Across Diverse Sites",
    situation: "Organizations operating across regions must account for differences in facilities, access needs and local routines.",
    pain: "A single process may not make site-level coverage and escalation ownership clear everywhere.",
    impact: "Inconsistent records may complicate oversight and cross-location incident reviews.",
    kpi: "site-coverage exceptions and cross-location incident handovers",
    event: "a regional review, new-site opening or vendor transition",
    solution: "ISI Security's site-coverage, access-procedure and operational-coordination capabilities",
  },
};

const serviceHeadlines = {
  template_comprehensive: "Comprehensive Security",
  template_physical_security: "Physical Security",
  template_electronic_security: "Electronic Security",
  template_facility_management: "Facility Management",
  template_event_security: "Event Security",
  template_campus_security: "Campus Security",
};

const escapeHtml = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const industryCardStyles = `
    .salutation { margin:0 0 16px; color:#1e293b; font-size:15px; font-weight:bold; line-height:1.6; }
    .stat-cards { width:100%; margin:18px 0 24px; table-layout:fixed; border-spacing:8px 0; }
    .stat-card-column { width:33.33%; padding:0; vertical-align:top; }
    .stat-card {
      height:100%; padding:16px 14px; border:1px solid #dbe5ef; border-top:3px solid #0b2545;
      border-radius:10px; background:#f8fafc; box-shadow:0 5px 16px rgba(15,37,69,.07);
      color:#334155; font-size:12px; line-height:1.6; vertical-align:top;
    }
    .stat-card-label { margin:0 0 8px; color:#0b2545; font-size:11px; font-weight:bold; letter-spacing:.6px; text-transform:uppercase; }
    .stat-card-copy { margin:0; color:#475569; font-size:12px; line-height:1.6; }
    .stat-cards .kpi { height:100%; margin:0; padding:16px 14px; border:1px solid #dbe5ef; border-top:3px solid #0b2545; border-left:1px solid #dbe5ef; border-radius:10px; background:#f8fafc; box-shadow:0 5px 16px rgba(15,37,69,.07); color:#475569; font-size:12px; line-height:1.6; vertical-align:top; }
    .stat-cards .kpi strong { display:block; margin:0 0 8px; color:#0b2545; font-size:11px; letter-spacing:.6px; text-transform:uppercase; }
    @media(max-width:560px) {
      .stat-cards, .stat-cards tbody, .stat-cards tr, .stat-card-column { display:block !important; width:100% !important; box-sizing:border-box; }
      .stat-card-column { padding:0 0 10px !important; }
      .stat-card, .stat-cards .kpi { height:auto; }
    }
`;

function makeIndustryStatCards(copy) {
  return `<table role="presentation" class="stat-cards" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="stat-card-column" width="33.33%">
            <div class="stat-card">
              <p class="stat-card-label">Situation</p>
              <p class="stat-card-copy">${escapeHtml(copy.cards.situation)}</p>
            </div>
          </td>
          <td class="stat-card-column" width="33.33%">
            <div class="stat-card">
              <p class="stat-card-label">Pain point</p>
              <p class="stat-card-copy">${escapeHtml(copy.cards.pain)}</p>
            </div>
          </td>
          <td class="stat-card-column" width="33.33%">
            <div class="kpi"><strong>Impact measure to review:</strong> ${escapeHtml(copy.kpi)}</div>
          </td>
        </tr>
      </table>`;
}

function enhanceIndustryTemplate(html, copy, filePath) {
  const greetingPattern = /<p\b[^>]*>[\s\S]*?<\/p>/gi;
  const hasGreeting = [...html.matchAll(greetingPattern)].some((match) =>
    /^(?:dear|hello|hi)\b/i.test(textContent(match[0]))
  );
  if (!hasGreeting) {
    html = html.replace(
      /(<h1\b[^>]*>[\s\S]*?<\/h1>)/i,
      '$1\n      <p class="salutation">Dear Valued Partner,</p>'
    );
  }

  if (!html.includes(".stat-cards {")) {
    html = html.replace(/(<style\b[^>]*>)/i, `$1${industryCardStyles}`);
  }

  const cardMarkup = makeIndustryStatCards(copy);
  if (/class="stat-cards"/i.test(html)) {
    html = html.replace(/<table\b[^>]*class="stat-cards"[^>]*>[\s\S]*?<\/table>/i, cardMarkup);
  } else {
    const kpiPattern = /<div class="kpi"><strong>Impact measure to review:<\/strong>[\s\S]*?<\/div>/i;
    if (!kpiPattern.test(html)) {
      throw new Error(`${path.relative(__dirname, filePath)} is missing the impact-measure card slot.`);
    }
    html = html.replace(kpiPattern, cardMarkup);
  }

  if (!html.includes('alt="ISI Security Footer Banner"')) {
    const footerPattern = /(<tr><td class="footer">[\s\S]*?<\/td><\/tr>)/i;
    if (!footerPattern.test(html)) {
      throw new Error(`${path.relative(__dirname, filePath)} is missing its company footer.`);
    }
    html = html.replace(
      footerPattern,
      '$1\n    <tr><td align="center" style="padding:0;"><img src="../assets/f1.png" alt="ISI Security Footer Banner" width="600" style="display:block;width:100%;height:auto;border:0;"></td></tr>'
    );
  }

  return html;
}

function getCopy(filePath) {
  const template = path.basename(filePath, ".html");
  const folder = path.basename(path.dirname(filePath));

  if (folder.endsWith("_industry")) {
    const industry = industries[folder.slice(0, -"_industry".length)];
    const service = services[template];
    if (!industry || !service) {
      throw new Error(`No SPICED copy is defined for ${path.relative(__dirname, filePath)}.`);
    }

    return {
      headline: `${industry.name}: ${serviceHeadlines[template]}`,
      situation: industry.situation,
      pain: service.pain,
      impact: industry.impact,
      event: industry.event,
      focus: service.focus,
      ctaLabel: service.label,
      paragraphs: [
        industry.situation,
        `${industry.pain} ${service.pain}`,
        industry.impact,
        `If ${industry.event} is approaching, ISI Security's ${service.focus} can be assessed against your site's requirements.`,
        "A discussion can focus on the procedures, responsibilities and reporting your team wants to review.",
      ],
      kpi: industry.kpi,
      cards: {
        situation: industry.situation,
        pain: `${industry.pain} ${service.pain}`,
      },
    };
  }

  const general = generalTemplates[template];
  if (!general) {
    throw new Error(`No SPICED copy is defined for ${path.relative(__dirname, filePath)}.`);
  }

  return {
    headline: general.headline,
    situation: general.situation,
    pain: general.pain,
    impact: general.impact,
    event: general.event,
    focus: general.solution,
    ctaLabel: "site security",
    paragraphs: [
      general.situation,
      general.pain,
      general.impact,
      `If ${general.event} is approaching, ${general.solution} can be considered against the requirements your team needs to address.`,
      "A short discussion can help clarify the priorities and measures relevant to your sites.",
    ],
    kpi: general.kpi,
  };
}

function textContent(html) {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function updateTemplate(filePath) {
  const original = fs.readFileSync(filePath, "utf8");
  const copy = getCopy(filePath);
  const isIndustryTemplate = path.basename(path.dirname(filePath)).endsWith("_industry");
  let updated = original;
  let headlineCount = 0;
  let metricCount = 0;

  updated = updated.replace(/(<h1\b[^>]*>)[\s\S]*?(<\/h1>)/i, (_match, open, close) => {
    headlineCount++;
    return `${open}${escapeHtml(copy.headline)}${close}`;
  });

  updated = updated.replace(/(<h1\b[^>]*>[\s\S]*?<\/h1>)([\s\S]*?)(?=<a class="cta")/i, (segment, heading, body) => {
    const statCardsStart = body.search(/<table\b[^>]*class="stat-cards"/i);
    const narrative = statCardsStart < 0 ? body : body.slice(0, statCardsStart);
    const cards = statCardsStart < 0 ? "" : body.slice(statCardsStart);
    const paragraphs = [...narrative.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)];
    const editable = paragraphs.filter((match) => !/^(?:dear|hello|hi)\b/i.test(textContent(match[0])));
    if (editable.length !== copy.paragraphs.length) {
      throw new Error(`${path.relative(__dirname, filePath)} has ${editable.length} editable body paragraphs; expected ${copy.paragraphs.length}.`);
    }

    let index = 0;
    const updatedNarrative = narrative.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (paragraph) => {
      if (/^(?:dear|hello|hi)\b/i.test(textContent(paragraph))) return paragraph;
      const copyText = copy.paragraphs[index++];
      return paragraph.replace(/(<p\b[^>]*>)[\s\S]*?(<\/p>)/i, (_match, open, close) =>
        `${open}${escapeHtml(copyText)}${close}`
      );
    });

    let updatedBody = `${updatedNarrative}${cards}`;
    updatedBody = updatedBody.replace(
      /(<div class="kpi"><strong>Impact measure to review:<\/strong>)[\s\S]*?(<\/div>)/i,
      (_match, open, close) => {
        metricCount++;
        return `${open} ${escapeHtml(copy.kpi)}${close}`;
      }
    );
    return `${heading}${updatedBody}`;
  });

  if (headlineCount !== 1 || metricCount !== 1) {
    throw new Error(`${path.relative(__dirname, filePath)} is missing the expected headline or impact-measure slot.`);
  }

  if (isIndustryTemplate) {
    updated = enhanceIndustryTemplate(updated, copy, filePath);
  }

  const protectedPatterns = [
    /<tr><td><img\b[^>]*><\/td><\/tr>/i,
    /<a class="cta"[\s\S]*?<\/a>/i,
    /<p style="margin:14px 0 0;color:#64748b;font-size:12px;">[\s\S]*?<\/p>/i,
    /<tr><td class="footer">[\s\S]*?<\/td><\/tr>/i,
  ];
  for (const pattern of protectedPatterns) {
    if (original.match(pattern)?.[0] !== updated.match(pattern)?.[0]) {
      throw new Error(`${path.relative(__dirname, filePath)} changed a protected header, CTA or footer element.`);
    }
  }

  const originalGreetings = [...original.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)]
    .map((match) => match[0])
    .filter((paragraph) => /^(?:dear|hello|hi)\b/i.test(textContent(paragraph)));
  const updatedGreetings = [...updated.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)]
    .map((match) => match[0])
    .filter((paragraph) => /^(?:dear|hello|hi)\b/i.test(textContent(paragraph)));
  const expectedGreetings = [...originalGreetings];
  if (isIndustryTemplate && expectedGreetings.length === 0) {
    expectedGreetings.push('<p class="salutation">Dear Valued Partner,</p>');
  }
  if (JSON.stringify(expectedGreetings) !== JSON.stringify(updatedGreetings)) {
    throw new Error(`${path.relative(__dirname, filePath)} changed its salutation.`);
  }

  if (updated !== original) fs.writeFileSync(filePath, updated, "utf8");
}

const spicedStyles = `
    .spiced-kicker { margin:18px 0 7px; color:#174a78; font-size:11px; font-weight:bold; letter-spacing:.8px; text-transform:uppercase; }
    .spiced-callout, .spiced-outcome { width:100%; margin:16px 0; border:1px solid #d8e5f2; border-left:4px solid #1769aa; border-collapse:separate; background:#f3f8fd; }
    .spiced-outcome { border-left-color:#0b2545; background:#f5f8fb; }
    .spiced-copy { margin:0 0 14px; color:#334155; font-size:15px; line-height:1.7; }
`;

function makeSpicedBody(copy) {
  const focus = escapeHtml(copy.focus);
  const measure = escapeHtml(copy.kpi);
  const cards = [
    ["Scope", focus],
    ["Ownership", "Escalation roles, handovers and exception follow-up"],
    ["Measure", measure],
  ];
  const cardMarkup = cards.map(([label, detail], index) => `
          <td class="stat-card-column" width="33.33%" style="width:33.33%;padding:0;vertical-align:top;">
            <div class="stat-card" style="height:100%;padding:15px 13px;border:1px solid #dbe5ef;border-top:3px solid ${index === 2 ? "#0b2545" : "#1769aa"};border-radius:10px;background:${index === 2 ? "#f1f6fb" : "#f8fafc"};color:#334155;font-size:12px;line-height:1.6;">
              <p class="stat-card-label" style="margin:0 0 8px;color:#174a78;font-size:10px;font-weight:bold;letter-spacing:.6px;text-transform:uppercase;">0${index + 1} ${escapeHtml(label)}</p>
              <p class="stat-card-copy" style="margin:0;color:#475569;font-size:12px;line-height:1.6;">${escapeHtml(detail)}</p>
            </div>
          </td>`).join("");

  return `
      <p class="spiced-kicker">SITUATION</p>
      <p class="spiced-copy">${escapeHtml(copy.situation)}</p>
      <table role="presentation" class="spiced-callout" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:16px 0;border:1px solid #d8e5f2;border-left:4px solid #1769aa;border-collapse:separate;background:#f3f8fd;">
        <tr><td style="padding:15px 17px;">
          <p style="margin:0 0 6px;color:#174a78;font-size:11px;font-weight:bold;letter-spacing:.7px;text-transform:uppercase;">The gap between procedure and practice</p>
          <p style="margin:0;color:#334155;font-size:14px;line-height:1.65;"><strong style="color:#0b2545;">PAIN</strong> ${escapeHtml(copy.pain)} <strong style="color:#0b2545;">IMPACT</strong> ${escapeHtml(copy.impact)}</p>
        </td></tr>
      </table>
      <p class="spiced-kicker">CRITICAL EVENT</p>
      <p class="spiced-copy">With ${escapeHtml(copy.event)} approaching, check whether current procedures, responsibilities and reporting still fit the way each site operates.</p>
      <p class="spiced-kicker">DECISION CRITERIA</p>
      <p class="spiced-copy">Compare measures such as ${measure} with site requirements. Ensure the review covers ${focus} and names owners for exceptions and follow-up.</p>
      <p class="spiced-kicker">Three checks to make the review practical</p>
      <table role="presentation" class="stat-cards" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:12px 0 20px;table-layout:fixed;border-spacing:8px 0;">
        <tr>${cardMarkup}
        </tr>
      </table>
      <table role="presentation" class="spiced-outcome" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:16px 0;border:1px solid #d8e5f2;border-left:4px solid #0b2545;border-collapse:separate;background:#f5f8fb;">
        <tr><td style="padding:15px 17px;">
          <p style="margin:0 0 6px;color:#174a78;font-size:11px;font-weight:bold;letter-spacing:.7px;text-transform:uppercase;">What you can take away</p>
          <p style="margin:0;color:#334155;font-size:14px;line-height:1.65;">A focused 20-minute conversation to identify one priority, agree what to measure and outline practical next checks with owners—without presuming the outcome.</p>
        </td></tr>
      </table>`;
}

function upgradeSpicedTemplate(filePath) {
  const original = fs.readFileSync(filePath, "utf8");
  const copy = getCopy(filePath);
  const salutation = /<p class="salutation"[^>]*>[\s\S]*?<\/p>/i.exec(original);
  const footerIndex = original.indexOf('<tr><td class="footer">');
  if (!salutation || footerIndex < 0) {
    throw new Error(`${path.relative(__dirname, filePath)} is missing its salutation or footer.`);
  }

  const contentStart = salutation.index + salutation[0].length;
  const ctaMatch = /<a class="cta"[\s\S]*?<\/a>/i.exec(original.slice(contentStart, footerIndex));
  if (!ctaMatch) {
    throw new Error(`${path.relative(__dirname, filePath)} is missing its CTA.`);
  }

  const cta = ctaMatch[0];
  const ctaOpen = /^<a\b[^>]*>/i.exec(cta)?.[0];
  if (!ctaOpen || !/href="mailto:/i.test(ctaOpen)) {
    throw new Error(`${path.relative(__dirname, filePath)} has no replyable CTA.`);
  }
  const ctaLabel = `Request a 20-minute ${copy.ctaLabel} review`;
  const updatedCta = `${ctaOpen}${escapeHtml(ctaLabel)}</a>`;
  const afterCtaStart = contentStart + ctaMatch.index + cta.length;
  const whatsAppMatch = /<p style="margin:14px 0 0;color:#64748b;font-size:12px;">[\s\S]*?<\/p>/i.exec(
    original.slice(afterCtaStart, footerIndex)
  );
  const whatsApp = whatsAppMatch ? whatsAppMatch[0] : "";
  const reply = `<p style="margin:0 0 14px;color:#475569;font-size:13px;line-height:1.6;">Reply with your upcoming trigger and a preferred time; we will tailor the discussion to your sites.</p>`;

  let updated = `${original.slice(0, contentStart)}${makeSpicedBody(copy)}\n      ${updatedCta}\n      ${reply}\n      ${whatsApp}\n    </td></tr>\n    ${original.slice(footerIndex)}`;
  if (!updated.includes(".spiced-callout {")) {
    updated = updated.replace(/(<style\b[^>]*>)/i, `$1${spicedStyles}`);
  }
  fs.writeFileSync(filePath, updated, "utf8");
}

function listTemplateFiles() {
  const files = [];
  for (const entry of fs.readdirSync(__dirname, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.endsWith("_industry")) {
      for (const file of fs.readdirSync(path.join(__dirname, entry.name))) {
        if (file.endsWith(".html")) files.push(path.join(__dirname, entry.name, file));
      }
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".html") &&
      !["index.html", "preview_report.html"].includes(entry.name)
    ) {
      files.push(path.join(__dirname, entry.name));
    }
  }
  return files;
}

const files = listTemplateFiles();
const remainingFiles = files.filter((file) => file !== path.join(__dirname, "template1.html"));
for (const file of remainingFiles) upgradeSpicedTemplate(file);
console.log(`Expanded SPICED email content in ${remainingFiles.length} templates.`);
