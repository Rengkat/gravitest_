import { Subject } from "./enums";

export const SUBJECT_LABEL_TO_ENUM: Record<string, Subject> = {
  // ── JAMB / WAEC / NECO / NABTEB / BECE shared ──
  "Use of English": Subject.ENGLISH,
  English: Subject.ENGLISH,
  Mathematics: Subject.MATHEMATICS,
  "Further Mathematics": Subject.FURTHER_MATHEMATICS,
  Physics: Subject.PHYSICS,
  Chemistry: Subject.CHEMISTRY,
  Biology: Subject.BIOLOGY,
  Economics: Subject.ECONOMICS,
  Government: Subject.GOVERNMENT,
  History: Subject.HISTORY,
  Geography: Subject.GEOGRAPHY,
  Commerce: Subject.COMMERCE,
  "Agricultural Science": Subject.AGRICULTURAL_SCIENCE,
  "Home Economics": Subject.HOME_ECONOMICS,
  Literature: Subject.LITERATURE_IN_ENGLISH,
  "Literature in English": Subject.LITERATURE_IN_ENGLISH,
  "Art (Fine Arts)": Subject.FINE_ARTS,
  Music: Subject.MUSIC,
  French: Subject.FRENCH,
  Arabic: Subject.ARABIC,
  Hausa: Subject.HAUSA,
  Igbo: Subject.IGBO,
  Yoruba: Subject.YORUBA,
  CRS: Subject.CHRISTIAN_RELIGIOUS_STUDIES,
  "Christian Religious Studies (CRS)": Subject.CHRISTIAN_RELIGIOUS_STUDIES,
  "Christian Studies": Subject.CHRISTIAN_RELIGIOUS_STUDIES,
  IRS: Subject.ISLAMIC_RELIGIOUS_STUDIES,
  "Islamic Studies (IRK)": Subject.ISLAMIC_RELIGIOUS_STUDIES,
  "Islamic Studies": Subject.ISLAMIC_RELIGIOUS_STUDIES,
  "Civic Education": Subject.CIVIC_EDUCATION,
  "Social Studies": Subject.SOCIAL_STUDIES,
  "Basic Science": Subject.BASIC_SCIENCE,
  "Business Studies": Subject.BUSINESS_STUDIES,
  "Technical Drawing": Subject.TECHNICAL_DRAWING,
  "Building Construction": Subject.BUILDING_CONSTRUCTION,
  "Electrical Installation": Subject.ELECTRICAL_INSTALLATION,
  Woodwork: Subject.WOODWORK,
  Metalwork: Subject.METALWORK,
  "Auto Mechanics": Subject.AUTO_MECHANICS,
  "Computer Studies": Subject.COMPUTER_STUDIES,
  "Computer Studies / Data Processing": Subject.COMPUTER_STUDIES,
  "Data Processing": Subject.DATA_PROCESSING,
  "Food & Nutrition": Subject.FOOD_AND_NUTRITION,
  "Principles of Accounts": Subject.ACCOUNTING,
  "Physical & Health Education (PHE)": Subject.PHYSICAL_EDUCATION,
  CCA: Subject.CULTURAL_AND_CREATIVE_ARTS,
  PVS: Subject.CIVIC_EDUCATION, // Physical & vocational — closest match

  // ── ICAN — Foundation ──
  "Quantitative Techniques in Business": Subject.QUANTITATIVE_TECHNIQUES,
  "Business and Finance": Subject.BUSINESS_AND_FINANCE,
  "Financial Accounting": Subject.FINANCIAL_ACCOUNTING,
  "Management Information": Subject.MANAGEMENT_INFORMATION,
  "Business Law": Subject.BUSINESS_LAW,

  // ── ICAN — Skills ──
  "Audit and Assurance": Subject.AUDIT,
  "Financial Reporting": Subject.FINANCIAL_REPORTING,
  Taxation: Subject.TAXATION,
  "Management Accounting": Subject.MANAGEMENT_ACCOUNTING,
  "Business Communication and Research Methodology": Subject.BUSINESS_COMMUNICATION,

  // ── ICAN — Professional ──
  "Corporate Reporting": Subject.CORPORATE_REPORTING,
  "Advanced Audit and Assurance": Subject.ADVANCED_AUDIT,
  "Strategic Financial Management": Subject.STRATEGIC_FINANCIAL_MANAGEMENT,
  "Advanced Taxation": Subject.ADVANCED_TAXATION,
  "Ethics and Governance": Subject.ETHICS_AND_GOVERNANCE,

  // ── NMCN — Basic ──
  "Anatomy and Physiology": Subject.ANATOMY, // compound; pick primary
  Anatomy: Subject.ANATOMY,
  Physiology: Subject.PHYSIOLOGY,
  "Microbiology and Parasitology": Subject.MICROBIOLOGY,
  "Nutrition and Dietetics": Subject.NUTRITION_AND_DIETETICS,
  Pharmacology: Subject.PHARMACOLOGY,
  "Introduction to Nursing Practice": Subject.NURSING_FUNDAMENTALS,
  "Community Health Nursing": Subject.COMMUNITY_HEALTH,

  // ── NMCN — Post-Basic ──
  "Medical-Surgical Nursing": Subject.MEDICAL_SURGICAL_NURSING,
  "Paediatric Nursing": Subject.PAEDIATRIC_NURSING,
  "Obstetric and Gynaecological Nursing": Subject.OBSTETRIC_NURSING,
  "Mental Health and Psychiatric Nursing": Subject.MENTAL_HEALTH_NURSING,
  "Accident and Emergency Nursing": Subject.ACCIDENT_EMERGENCY_NURSING,

  // ── NMCN — Advanced ──
  "Advanced Clinical Nursing": Subject.ADVANCED_CLINICAL_NURSING,
  "Nursing Research and Education": Subject.NURSING_RESEARCH_AND_EDUCATION,
  "Nursing Administration and Management": Subject.NURSING_ADMINISTRATION,
  "Nurse Prescribing and Pharmacotherapeutics": Subject.NURSE_PRESCRIBING,
  Midwifery: Subject.MIDWIFERY,

  // ── CIPM — Associate ──
  "Organisational Behaviour": Subject.ORGANISATIONAL_BEHAVIOUR,
  "Human Resource Management": Subject.HUMAN_RESOURCE_MANAGEMENT,
  "Employment Law": Subject.EMPLOYMENT_LAW,
  "Learning and Development": Subject.LEARNING_AND_DEVELOPMENT,
  "Compensation and Benefits Management": Subject.COMPENSATION_AND_BENEFITS,

  // ── CIPM — Chartered ──
  "Strategic Human Resource Management": Subject.STRATEGIC_HRM,
  "Labour Relations and Collective Bargaining": Subject.LABOUR_RELATIONS,
  "HR Metrics and Analytics": Subject.HR_METRICS_AND_ANALYTICS,
  "Organisational Development and Change Management": Subject.ORGANISATIONAL_DEVELOPMENT,
  "Performance Management": Subject.PERFORMANCE_MANAGEMENT,

  // ── CIPM — Fellow ──
  "Leadership and Corporate Governance": Subject.LEADERSHIP_AND_CORPORATE_GOVERNANCE,
  "Advanced Strategic HRM": Subject.ADVANCED_STRATEGIC_HRM,
  "HR Consulting and Advisory": Subject.HR_CONSULTING,

  // ── NIM — Diploma ──
  "Principles of Management": Subject.PRINCIPLES_OF_MANAGEMENT,
  "Business Communication": Subject.BUSINESS_COMMUNICATION,
  "Economics for Managers": Subject.ECONOMICS_FOR_MANAGERS,
  "Accounting for Non-Accountants": Subject.ACCOUNTING_FOR_NON_ACCOUNTANTS,
  "Marketing Management": Subject.MARKETING_MANAGEMENT,

  // ── NIM — Graduate ──
  "Strategic Management": Subject.STRATEGIC_MANAGEMENT,
  "Operations Management": Subject.OPERATIONS_MANAGEMENT,
  "Human Resources Management": Subject.HUMAN_RESOURCE_MANAGEMENT,
  "Financial Management": Subject.FINANCIAL_MANAGEMENT,
  "Business Law and Ethics": Subject.BUSINESS_LAW,
  "Entrepreneurship and Innovation": Subject.ENTREPRENEURSHIP_AND_INNOVATION,

  // ── NIM — Fellow ──
  "Corporate Governance": Subject.CORPORATE_GOVERNANCE,
  "Advanced Strategic Management": Subject.ADVANCED_STRATEGIC_MANAGEMENT,
  "Leadership and Executive Development": Subject.EXECUTIVE_LEADERSHIP,
  "Research Methods and Project": Subject.RESEARCH_METHODS,

  // ── NIESV — Foundation ──
  "Land Law and Administration": Subject.LAND_LAW_AND_ADMINISTRATION,
  "Building Construction and Technology": Subject.BUILDING_CONSTRUCTION_AND_TECHNOLOGY,
  "Valuation Principles": Subject.VALUATION_PRINCIPLES,
  "Town Planning and Development Control": Subject.TOWN_PLANNING,
  "Economics of Property": Subject.ECONOMICS_OF_PROPERTY,

  // ── NIESV — Professional ──
  "Advanced Valuation": Subject.ADVANCED_VALUATION,
  "Property Management": Subject.PROPERTY_MANAGEMENT,
  "Estate Agency and Marketing": Subject.ESTATE_AGENCY_AND_MARKETING,
  "Facilities Management": Subject.FACILITIES_MANAGEMENT,
  "Dispute Resolution and Arbitration": Subject.DISPUTE_RESOLUTION_AND_ARBITRATION,
  "Real Estate Finance and Investment": Subject.REAL_ESTATE_FINANCE,
};

// Reverse map — enum value → display label (uses first registered label per enum)
export const SUBJECT_ENUM_TO_LABEL: Record<Subject, string> = Object.entries(
  SUBJECT_LABEL_TO_ENUM,
).reduce(
  (acc, [label, enumVal]) => {
    if (!acc[enumVal]) acc[enumVal] = label; // first label wins
    return acc;
  },
  {} as Record<Subject, string>,
);

// Helper: label → enum (throws if unmapped, so you catch gaps at dev time)
export function toLabelEnum(label: string): Subject {
  const val = SUBJECT_LABEL_TO_ENUM[label];
  if (!val) throw new Error(`[Subject] Unmapped label: "${label}"`);
  return val;
}

// Helper: enum → label
export function toSubjectLabel(subject: Subject): string {
  return SUBJECT_ENUM_TO_LABEL[subject] ?? subject;
}
