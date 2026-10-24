const INDUSTRY_CONTEXTS = {
  healthcare: {
    label: "Healthcare operations",
    roles: "hospital administrators, operations leaders, and facilities or security managers",
    situation: "Where relevant, hospital teams coordinate patient, staff, vendor, and visitor movement across entrances and shifts.",
    operatingContext: "care sites coordinating patient, staff, vendor, and visitor movement across entrances and shifts",
    pain: "access routines and security handovers across entrances and clinical areas can be difficult to coordinate",
    impactKpi: "visitor and contractor access exceptions, plus security-event handover time",
    services: "manned guarding, access management, and facility security"
  },
  bfsi: {
    label: "Banking and financial-services operations",
    roles: "branch operations leaders, facilities managers, and physical-security decision-makers",
    situation: "Where relevant, branch and office teams coordinate employee, visitor, vendor, and cash-area access across locations.",
    operatingContext: "branches and offices coordinating employee, visitor, vendor, and cash-area access",
    pain: "different branch routines can make access ownership and site-event follow-up harder to review",
    impactKpi: "site access exceptions and time to route a physical-security event",
    services: "manned guarding, access management, and CCTV surveillance"
  },
  logistics: {
    label: "Logistics and distribution operations",
    roles: "distribution, warehouse, facilities, and security operations leaders",
    situation: "Where relevant, warehouse teams coordinate driver, contractor, workforce, and loading-area access across operating shifts.",
    operatingContext: "warehouses and distribution sites coordinating driver, contractor, workforce, and loading-area access",
    pain: "busy gate activity and shift handovers can make site access and incident ownership harder to track",
    impactKpi: "contractor access exceptions and unresolved security handovers",
    services: "site guarding, access checks, and perimeter patrols"
  },
  manufacturing: {
    label: "Manufacturing and plant operations",
    roles: "plant managers, operations leaders, and facilities or security managers",
    situation: "Where relevant, plant teams coordinate workforce and contractor access around production shifts and restricted areas.",
    operatingContext: "production sites coordinating workforce and contractor access around shifts and restricted areas",
    pain: "contractor entry and shift handovers can leave gaps in site-level access ownership",
    impactKpi: "access exceptions and security handover gaps by site or shift",
    services: "industrial guarding, access management, and perimeter patrols"
  },
  aerospace: {
    label: "Aerospace facility operations",
    roles: "facility, operations, and site-security decision-makers",
    situation: "Where relevant, aerospace facilities coordinate staff, contractor, and visitor access around hangars and maintenance areas.",
    operatingContext: "facilities such as hangars and maintenance areas coordinating staff, contractor, and visitor access",
    pain: "site access procedures and shift handovers can be difficult to keep visible across operational areas",
    impactKpi: "access exceptions and security handover gaps",
    services: "physical guarding, access procedures, and facility security"
  },
  construction: {
    label: "Construction project operations",
    roles: "project directors, site managers, and facilities or security leads",
    situation: "Where relevant, project teams coordinate workforce, contractor, equipment, and access-point activity as site work changes.",
    operatingContext: "active project sites with changing workforces, contractors, equipment, and access points",
    pain: "changing site activity can make contractor access and responsibility handovers harder to coordinate",
    impactKpi: "contractor access exceptions and site-security handover gaps",
    services: "site guarding, access checks, and physical-security assessment"
  },
  education: {
    label: "Education and campus operations",
    roles: "campus administrators, operations leaders, and facilities or security managers",
    situation: "Where relevant, campus teams coordinate student, staff, visitor, vendor, and event access across facilities.",
    operatingContext: "campuses coordinating student, staff, visitor, vendor, and event access",
    pain: "visitor authorization and security handovers can vary between campus entrances and operating periods",
    impactKpi: "visitor access exceptions and unresolved security handovers",
    services: "manned guarding, visitor access procedures, and facility security"
  },
  hospitality: {
    label: "Hospitality and property operations",
    roles: "hotel general managers, property operations leaders, and facilities or security managers",
    situation: "Where relevant, hotel teams coordinate guest, employee, service-vendor, and back-of-house access across shifts.",
    operatingContext: "guest-facing properties coordinating guest, employee, service-vendor, and back-of-house access",
    pain: "guest-area and service-area routines can make access responsibilities harder to coordinate across shifts",
    impactKpi: "access exceptions and security-event handover time",
    services: "property guarding, access procedures, and facility security"
  },
  it_ites: {
    label: "IT/ITES workplace operations",
    roles: "workplace, facilities, corporate operations, and physical-security decision-makers",
    situation: "Where relevant, workplace teams coordinate employee, visitor, and contractor access across offices and campuses.",
    operatingContext: "corporate offices and campuses coordinating employee, visitor, and contractor access",
    pain: "visitor authorization and physical access routines can vary between offices and shifts",
    impactKpi: "visitor access exceptions and physical-security handover gaps",
    services: "manned guarding, physical access management, and facility security"
  },
  retail: {
    label: "Retail and store operations",
    roles: "retail operations leaders, loss-prevention teams, and facilities managers",
    situation: "Where relevant, store teams coordinate customer-facing activity with staff, delivery, stockroom, and vendor access.",
    operatingContext: "stores coordinating customer-facing activity with staff, delivery, stockroom, and vendor access",
    pain: "unclear floor, delivery, and back-of-house routines can make site incidents harder to review",
    impactKpi: "site access exceptions and incident-review handover gaps",
    services: "store guarding, access procedures, and physical-security assessment"
  },
  smart_cities: {
    label: "Public-infrastructure and smart-city site operations",
    roles: "infrastructure operations leaders, facility managers, and site-security decision-makers",
    situation: "Where relevant, infrastructure teams coordinate staff, contractor, visitor, and site access across public facilities.",
    operatingContext: "public-infrastructure facilities coordinating staff, contractor, visitor, and site access",
    pain: "access ownership and incident handovers can vary between facilities and operating teams",
    impactKpi: "site access exceptions and time to route a physical-security event",
    services: "site guarding, access procedures, and physical-security assessment"
  }
};

const INDUSTRY_ALIASES = {
  healthcare: ["healthcare", "healthcareindustry", "hospital", "hospitals"],
  bfsi: ["bfsi", "banking", "financialservices", "finance"],
  logistics: ["logistics", "distribution", "warehouse", "warehousing"],
  manufacturing: ["manufacturing", "manufacturingindustry", "plant", "industrial"],
  aerospace: ["aerospace", "aerospaceindustry", "aviation"],
  construction: ["construction", "constructionindustry", "projectsite"],
  education: ["education", "educationindustry", "campus", "university", "school"],
  hospitality: ["hospitality", "hospitalityindustry", "hotel", "hotels"],
  it_ites: ["itites", "it", "ites", "informationtechnology"],
  retail: ["retail", "retailindustry", "store", "stores"],
  smart_cities: ["smartcities", "smartcity", "infrastructure", "publicinfrastructure"]
};

function normalizeIndustry(value) {
  return typeof value === "string" ? value.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
}

function resolveIndustryContext(industry) {
  const normalized = normalizeIndustry(industry);
  for (const [key, aliases] of Object.entries(INDUSTRY_ALIASES)) {
    if (aliases.some((alias) => normalized === alias || normalized.startsWith(alias))) {
      return INDUSTRY_CONTEXTS[key];
    }
  }

  return {
    label: typeof industry === "string" && industry.trim() ? `${industry.trim()} operations` : "Business operations",
    roles: "operations, facilities, and security decision-makers",
    situation: "At the relevant sites, teams may coordinate staff, visitors, contractors, and access to physical assets.",
    operatingContext: "business sites coordinating staff, visitors, contractors, and physical assets",
    pain: "site access routines and security handovers can be difficult to coordinate consistently",
    impactKpi: "site access exceptions and security handover gaps",
    services: "manned guarding, access management, and physical-security risk assessment"
  };
}

module.exports = {
  INDUSTRY_CONTEXTS,
  resolveIndustryContext
};
