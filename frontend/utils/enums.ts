export enum Subject {
  // ── Core Sciences ──
  MATHEMATICS = "mathematics",
  FURTHER_MATHEMATICS = "further_mathematics",
  PHYSICS = "physics",
  CHEMISTRY = "chemistry",
  BIOLOGY = "biology",
  GENERAL_SCIENCE = "general_science",
  BASIC_SCIENCE = "basic_science",
  INTEGRATED_SCIENCE = "integrated_science",

  // ── English & Languages ──
  ENGLISH = "english",
  ENGLISH_LITERATURE = "english_literature",
  LITERATURE_IN_ENGLISH = "literature_in_english",
  YORUBA = "yoruba",
  HAUSA = "hausa",
  IGBO = "igbo",
  FRENCH = "french",
  ARABIC = "arabic",
  GERMAN = "german",
  LATIN = "latin",

  // ── Humanities & Social Sciences ──
  ECONOMICS = "economics",
  GOVERNMENT = "government",
  HISTORY = "history",
  GEOGRAPHY = "geography",
  CIVIC_EDUCATION = "civic_education",
  SOCIAL_STUDIES = "social_studies",
  RELIGIOUS_STUDIES = "religious_studies",
  CHRISTIAN_RELIGIOUS_STUDIES = "christian_religious_studies",
  ISLAMIC_RELIGIOUS_STUDIES = "islamic_religious_studies",
  PHILOSOPHY = "philosophy",
  PSYCHOLOGY = "psychology",
  SOCIOLOGY = "sociology",
  ANTHROPOLOGY = "anthropology",

  // ── Commerce & Business ──
  COMMERCE = "commerce",
  ACCOUNTING = "accounting",
  BUSINESS_STUDIES = "business_studies",
  BUSINESS_MANAGEMENT = "business_management",
  MARKETING = "marketing",
  INSURANCE = "insurance",
  OFFICE_PRACTICE = "office_practice",
  STORE_KEEPING = "store_keeping",
  ENTREPRENEURSHIP = "entrepreneurship",

  // ── Technical & Vocational ──
  TECHNICAL_DRAWING = "technical_drawing",
  BUILDING_CONSTRUCTION = "building_construction",
  WOODWORK = "woodwork",
  METALWORK = "metalwork",
  AUTO_MECHANICS = "auto_mechanics",
  ELECTRICAL_INSTALLATION = "electrical_installation",
  ELECTRONICS = "electronics",
  COMPUTER_STUDIES = "computer_studies",
  COMPUTER_SCIENCE = "computer_science",
  DATA_PROCESSING = "data_processing",
  INFORMATION_TECHNOLOGY = "information_technology",
  PROGRAMMING = "programming",
  WEB_DEVELOPMENT = "web_development",

  // ── Arts & Creative ──
  FINE_ARTS = "fine_arts",
  CREATIVE_ARTS = "creative_arts",
  MUSIC = "music",
  THEATRE_ARTS = "theatre_arts",
  DANCE = "dance",
  CULTURAL_AND_CREATIVE_ARTS = "cultural_and_creative_arts",

  // ── Home Economics & Practical ──
  HOME_ECONOMICS = "home_economics",
  FOOD_AND_NUTRITION = "food_and_nutrition",
  TEXTILES = "textiles",
  CLOTHING_AND_TEXTILES = "clothing_and_textiles",
  CATERING = "catering",
  HOSPITALITY = "hospitality",

  // ── Agriculture ──
  AGRICULTURAL_SCIENCE = "agricultural_science",
  ANIMAL_HUSBANDRY = "animal_husbandry",
  CROP_PRODUCTION = "crop_production",
  FISHERIES = "fisheries",
  FORESTRY = "forestry",

  // ── Health & Physical ──
  HEALTH_EDUCATION = "health_education",
  PHYSICAL_EDUCATION = "physical_education",
  HUMAN_KINETICS = "human_kinetics",
  NUTRITION = "nutrition",
  PUBLIC_HEALTH = "public_health",
  // ── Professional Exams: ICAN — Foundation ──
  QUANTITATIVE_TECHNIQUES = "quantitative_techniques",
  BUSINESS_AND_FINANCE = "business_and_finance",
  FINANCIAL_ACCOUNTING = "financial_accounting",
  MANAGEMENT_INFORMATION = "management_information",
  BUSINESS_LAW = "business_law",

  // ── Professional Exams: ICAN — Skills ──
  AUDIT = "audit",
  FINANCIAL_REPORTING = "financial_reporting",
  TAXATION = "taxation",
  MANAGEMENT_ACCOUNTING = "management_accounting",
  BUSINESS_COMMUNICATION = "business_communication",

  // ── Professional Exams: ICAN — Professional ──
  CORPORATE_REPORTING = "corporate_reporting",
  ADVANCED_AUDIT = "advanced_audit",
  STRATEGIC_FINANCIAL_MANAGEMENT = "strategic_financial_management",
  ADVANCED_TAXATION = "advanced_taxation",
  ETHICS_AND_GOVERNANCE = "ethics_and_governance",

  // ── Professional Exams: NMCN — Basic ──
  ANATOMY = "anatomy",
  PHYSIOLOGY = "physiology",
  MICROBIOLOGY = "microbiology",
  NUTRITION_AND_DIETETICS = "nutrition_and_dietetics",
  PHARMACOLOGY = "pharmacology",
  NURSING_FUNDAMENTALS = "nursing_fundamentals",
  COMMUNITY_HEALTH = "community_health",

  // ── Professional Exams: NMCN — Post-Basic ──
  MEDICAL_SURGICAL_NURSING = "medical_surgical_nursing",
  PAEDIATRIC_NURSING = "paediatric_nursing",
  OBSTETRIC_NURSING = "obstetric_nursing",
  MENTAL_HEALTH_NURSING = "mental_health_nursing",
  ACCIDENT_EMERGENCY_NURSING = "accident_emergency_nursing",

  // ── Professional Exams: NMCN — Advanced ──
  ADVANCED_CLINICAL_NURSING = "advanced_clinical_nursing",
  NURSING_RESEARCH_AND_EDUCATION = "nursing_research_and_education",
  NURSING_ADMINISTRATION = "nursing_administration",
  NURSE_PRESCRIBING = "nurse_prescribing",
  MIDWIFERY = "midwifery", // retained

  // ── Professional Exams: CIPM — Associate ──
  ORGANISATIONAL_BEHAVIOUR = "organisational_behaviour",
  HUMAN_RESOURCE_MANAGEMENT = "human_resource_management",
  EMPLOYMENT_LAW = "employment_law",
  LEARNING_AND_DEVELOPMENT = "learning_and_development",
  COMPENSATION_AND_BENEFITS = "compensation_and_benefits",

  // ── Professional Exams: CIPM — Chartered ──
  STRATEGIC_HRM = "strategic_hrm",
  LABOUR_RELATIONS = "labour_relations",
  HR_METRICS_AND_ANALYTICS = "hr_metrics_and_analytics",
  ORGANISATIONAL_DEVELOPMENT = "organisational_development",
  PERFORMANCE_MANAGEMENT = "performance_management",

  // ── Professional Exams: CIPM — Fellow ──
  LEADERSHIP_AND_CORPORATE_GOVERNANCE = "leadership_and_corporate_governance",
  ADVANCED_STRATEGIC_HRM = "advanced_strategic_hrm",
  HR_CONSULTING = "hr_consulting",

  // ── Professional Exams: NIM — Diploma ──
  PRINCIPLES_OF_MANAGEMENT = "principles_of_management",
  ECONOMICS_FOR_MANAGERS = "economics_for_managers",
  ACCOUNTING_FOR_NON_ACCOUNTANTS = "accounting_for_non_accountants",
  MARKETING_MANAGEMENT = "marketing_management",

  // ── Professional Exams: NIM — Graduate ──
  STRATEGIC_MANAGEMENT = "strategic_management",
  OPERATIONS_MANAGEMENT = "operations_management",
  FINANCIAL_MANAGEMENT = "financial_management",
  ENTREPRENEURSHIP_AND_INNOVATION = "entrepreneurship_and_innovation",

  // ── Professional Exams: NIM — Fellow ──
  CORPORATE_GOVERNANCE = "corporate_governance",
  ADVANCED_STRATEGIC_MANAGEMENT = "advanced_strategic_management",
  EXECUTIVE_LEADERSHIP = "executive_leadership",

  // ── Professional Exams: NIESV — Foundation ──
  LAND_LAW_AND_ADMINISTRATION = "land_law_and_administration",
  BUILDING_CONSTRUCTION_AND_TECHNOLOGY = "building_construction_and_technology",
  VALUATION_PRINCIPLES = "valuation_principles",
  TOWN_PLANNING = "town_planning",
  ECONOMICS_OF_PROPERTY = "economics_of_property",

  // ── Professional Exams: NIESV — Professional ──
  ADVANCED_VALUATION = "advanced_valuation",
  PROPERTY_MANAGEMENT = "property_management",
  ESTATE_AGENCY_AND_MARKETING = "estate_agency_and_marketing",
  FACILITIES_MANAGEMENT = "facilities_management",
  DISPUTE_RESOLUTION_AND_ARBITRATION = "dispute_resolution_and_arbitration",
  REAL_ESTATE_FINANCE = "real_estate_finance",

  // ── Professional Exams: Engineering ──
  ENGINEERING_MATHEMATICS = "engineering_mathematics",
  STRENGTH_OF_MATERIALS = "strength_of_materials",
  FLUID_MECHANICS = "fluid_mechanics",
  THERMODYNAMICS = "thermodynamics",
  STRUCTURAL_ANALYSIS = "structural_analysis",
  GEOTECHNICAL_ENGINEERING = "geotechnical_engineering",
  ELECTRICAL_CIRCUITS = "electrical_circuits",
  DIGITAL_ELECTRONICS = "digital_electronics",
  CONTROL_ENGINEERING = "control_engineering",
  TELECOMMUNICATIONS = "telecommunications",

  // ── Professional Exams: Law ──
  CONSTITUTIONAL_LAW = "constitutional_law",
  CRIMINAL_LAW = "criminal_law",
  CONTRACT_LAW = "contract_law",
  TORT_LAW = "tort_law",
  PROPERTY_LAW = "property_law",
  COMPANY_LAW = "company_law",
  CORPORATE_LAW = "corporate_law",
  EVIDENCE_LAW = "evidence_law",

  // ── Advanced & Specialized ──
  STATISTICS = "statistics",
  QUANTITATIVE_METHODS = "quantitative_methods",
  OPERATIONS_RESEARCH = "operations_research",
  PROJECT_MANAGEMENT = "project_management",
  RESEARCH_METHODS = "research_methods",
  LOGIC = "logic",
  ETHICS = "ethics",
  BIOCHEMISTRY = "biochemistry",
  PATHOLOGY = "pathology",
  // ── Test Prep ──
  VERBAL_REASONING = "verbal_reasoning",
  QUANTITATIVE_REASONING = "quantitative_reasoning",
  GENERAL_KNOWLEDGE = "general_knowledge",
  CURRENT_AFFAIRS = "current_affairs",
  IQ_TEST = "iq_test",
  APTITUDE_TEST = "aptitude_test",
}

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
  PREFER_NOT_TO_SAY = "prefer_not_to_say",
}

export enum NigerianState {
  ABIA = "Abia",
  ADAMAWA = "Adamawa",
  AKWA_IBOM = "Akwa Ibom",
  ANAMBRA = "Anambra",
  BAUCHI = "Bauchi",
  BAYELSA = "Bayelsa",
  BENUE = "Benue",
  BORNO = "Borno",
  CROSS_RIVER = "Cross River",
  DELTA = "Delta",
  EBONYI = "Ebonyi",
  EDO = "Edo",
  EKITI = "Ekiti",
  ENUGU = "Enugu",
  GOMBE = "Gombe",
  IMO = "Imo",
  JIGAWA = "Jigawa",
  KADUNA = "Kaduna",
  KANO = "Kano",
  KATSINA = "Katsina",
  KEBBI = "Kebbi",
  KOGI = "Kogi",
  KWARA = "Kwara",
  LAGOS = "Lagos",
  NASARAWA = "Nasarawa",
  NIGER = "Niger",
  OGUN = "Ogun",
  ONDO = "Ondo",
  OSUN = "Osun",
  OYO = "Oyo",
  PLATEAU = "Plateau",
  RIVERS = "Rivers",
  SOKOTO = "Sokoto",
  TARABA = "Taraba",
  YOBE = "Yobe",
  ZAMFARA = "Zamfara",
  FCT_ABUJA = "Federal Capital Territory",
}

export enum ExamType {
  JAMB = "jamb",
  WAEC = "waec",
  NECO = "neco",
  NABTEB = "nabteb",
  BECE = "bece",
  JUNIOR_NECO = "junior_neco",
  ICAN = "ican",
  NMCN = "nmcn",
  CIPM = "cipm",
  NIM = "nim",
  NIESV = "niesv",
  CIBN = "cibn",
  NSE = "nse",
  ICEN = "icen",
  NIQS = "niqs",
  ARCON = "arcon",
  MLSCN = "mlscn",
  PCN = "pcn",
  COMMON_ENTRANCE = "common_entrance",
}

// School (internal) vs private (external) candidate — only meaningful for
// WAEC, NECO, NABTEB, BECE and Junior NECO (see CANDIDATE_TYPE_EXAMS in
// utils/config.ts). A question/session left unset applies to both.
export enum CandidateType {
  SCHOOL = "school", // a.k.a. "internal candidate"
  PRIVATE = "private", // a.k.a. "external candidate"
}

export enum UserRole {
  STUDENT = "student",
  PROFESSIONAL_STUDENT = "professional_student",
  CLASS_ADMIN = "class_admin",
  SUPER_ADMIN = "super_admin",
}

export enum DeactivationType {
  ADMIN_SUSPENSION = "ADMIN_SUSPENSION",
  SECURITY_LOCK = "SECURITY_LOCK",
  USER_REQUEST = "USER_REQUEST",
  UNVERIFIED_EMAIL = "UNVERIFIED_EMAIL",
}
