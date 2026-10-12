// =================================================================
// ENUMS
// =================================================================

// ── 1. USER & AUTH ────────────────────────────────────────────────

export enum UserRole {
  STUDENT = 'student',
  PROFESSIONAL_STUDENT = 'professional_student',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum AdminInviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  PHONE = 'phone',
  EMAIL = 'email',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum OtpPurpose {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
  TWO_FACTOR_AUTH = 'TWO_FACTOR_AUTH',
}

export enum DeactivationType {
  ADMIN_SUSPENSION = 'ADMIN_SUSPENSION',
  SECURITY_LOCK = 'SECURITY_LOCK',
  USER_REQUEST = 'USER_REQUEST',
  UNVERIFIED_EMAIL = 'UNVERIFIED_EMAIL',
}

// ── 2. SUBSCRIPTION ───────────────────────────────────────────────

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  PENDING = 'pending', // proposed — awaiting first successful payment
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  TRIAL = 'trial',
  PAST_DUE = 'past_due', // proposed — renewal charge failed, grace period
}

export enum BillingInterval {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
}
// ── Transactions (generic — genuinely new, no existing references found) ──

export enum TransactionType {
  SUBSCRIPTION = 'subscription',
  CONTENT_PURCHASE = 'content_purchase', // reserved — e.g. your Library module
  WALLET_FUNDING = 'wallet_funding', // reserved for future modules
  OTHER = 'other',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  ABANDONED = 'abandoned', // user left checkout without completing
  REVERSED = 'reversed', // refunded / chargeback
}

// Payment rails the platform can collect through. Stored as plain varchar in
// the DB (not a Postgres enum) so adding a gateway later never needs an
// ALTER TYPE migration — validate against this enum at the API boundary.
export enum PaymentGatewayCode {
  PAYSTACK = 'paystack',
  OPAY = 'opay',
}

// ── Feature access control (admin-configurable paywall) ──────────────────

// Every gate-able product capability. The KEYS are code (something has to
// call assertAccess(feature) for a gate to exist); which tier they need,
// whether they're free, and any free quota are admin data.
export enum FeatureKey {
  CBT_PRACTICE = 'cbt_practice', // past-question practice sessions
  CBT_MOCK = 'cbt_mock', // timed mock exams
  AI_TUTOR = 'ai_tutor',
  AI_EXPLAIN = 'ai_explain', // the first AI explanation of a question
  AI_EXPLAIN_MORE = 'ai_explain_more', // "Explain more" — the deeper follow-up explanation
  AI_ESSAY_SCORING = 'ai_essay_scoring',
  AI_ESSAY_ELABORATE = 'ai_essay_elaborate', // detailed breakdown of an essay score, after scoring/review
  LIBRARY_PREMIUM = 'library_premium', // tier-locked library content
}

export enum FeatureAccessMode {
  FREE = 'free', // open to everyone
  PAID = 'paid', // needs `minTier` (or the free quota, if one is set)
  DISABLED = 'disabled', // kill switch — nobody, e.g. during an incident
}

export enum QuotaPeriod {
  DAILY = 'daily',
  MONTHLY = 'monthly',
}

export enum TransactionChannel {
  CARD = 'card',
  BANK = 'bank',
  BANK_TRANSFER = 'bank_transfer',
  USSD = 'ussd',
  QR = 'qr',
  MOBILE_MONEY = 'mobile_money',
  APPLE_PAY = 'apple_pay',
}

// ── 3. CLASS LEVEL ─────────────────────────────────────────────────
export enum ClassLevel {
  JSS1 = 'jss1',
  JSS2 = 'jss2',
  JSS3 = 'jss3',
  SS1 = 'ss1',
  SS2 = 'ss2',
  SS3 = 'ss3',
}

export enum EnrollmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  GRADUATED = 'graduated',
  SUSPENDED = 'suspended',
}

export enum TestStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

// ── 4. EXAM / CBT ─────────────────────────────────────────────────

export enum ExamType {
  JAMB = 'jamb',
  WAEC = 'waec',
  NECO = 'neco',
  NABTEB = 'nabteb',
  BECE = 'bece',
  JUNIOR_NECO = 'junior_neco',
  POST_UTME = 'post_utme',
  ICAN = 'ican',
  NMCN = 'nmcn',
  CIPM = 'cipm',
  NIM = 'nim',
  NIESV = 'niesv',
  CIBN = 'cibn',
  NSE = 'nse',
  ICEN = 'icen',
  NIQS = 'niqs',
  ARCON = 'arcon',
  MLSCN = 'mlscn',
  PCN = 'pcn',
  COMMON_ENTRANCE = 'common_entrance',
}

export enum ExamMode {
  PRACTICE = 'practice',
  MOCK = 'mock',
}

// Some exam bodies (WAEC, NECO, NABTEB, BECE, Junior NECO...) register
// candidates in two streams that can sit different papers/questions:
//  - SCHOOL:  "school candidate" / internal candidate — registered through
//    a recognized secondary school.
//  - PRIVATE: "private candidate" / external candidate — registers
//    individually, not through a school.
// A Question left without a candidateType (null) applies to both streams
// (the common case, since most past questions are shared) — this enum
// only needs to be set when an admin is tagging a paper that's actually
// specific to one stream. See CANDIDATE_TYPE_EXAM_TYPES below for which
// ExamType values this distinction applies to.
export enum CandidateType {
  SCHOOL = 'school', // a.k.a. "internal candidate"
  PRIVATE = 'private', // a.k.a. "external candidate"
}

// ExamType values where the school/private (internal/external) candidate
// distinction is a real, meaningful thing to filter/tag questions by.
// JAMB, POST_UTME and the professional exams (ICAN, NMCN, etc.) have no
// such distinction, so they're deliberately left out — keeping this as
// one shared list (rather than re-deriving it in every module) is what
// lets the admin UI, the practice wizard, and question filtering all
// agree on exactly which exams show the extra selector.
export const CANDIDATE_TYPE_EXAM_TYPES: ExamType[] = [
  ExamType.WAEC,
  ExamType.NECO,
  ExamType.NABTEB,
  ExamType.BECE,
  ExamType.JUNIOR_NECO,
];

export enum QuestionType {
  MCQ = 'mcq',
  THEORY = 'theory',
  PRACTICAL = 'practical',
  TRUE_FALSE = 'true_false',
  FILL_BLANKS = 'fill_blanks',
  MATCHING = 'matching',
  OBJECTIVE = 'objective',
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum SessionStatus {
  IN_PROGRESS = 'in_progress',
  SCHEDULED = 'scheduled',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  SUBMITTED = 'submitted',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
  NO_SHOW = 'no_show',
  MISSED = 'missed',
  ABANDONED = 'abandoned',
  TIMED_OUT = 'timed_out',
}

// ── 6. PAYMENT ────────────────────────────────────────────────────

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
  ABANDONED = 'abandoned',
}

export enum PaymentPurpose {
  SUBSCRIPTION = 'subscription',
  LIBRARY_CONTENT = 'library_content',
}

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// ── 7. CONTENT & LIBRARY ──────────────────────────────────────────

export enum ContentType {
  EBOOK = 'ebook',
  VIDEO = 'video',
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  QUIZ = 'quiz',
  PAST_QUESTION = 'past_question',
  PRACTICE_SET = 'practice_set',
}

// ── 8. STUDY & PROGRESS ───────────────────────────────────────────

export enum StreakStatus {
  ACTIVE = 'active',
  BROKEN = 'broken',
  FROZEN = 'frozen',
  ACHIEVED = 'achieved',
}

export enum WeakTopicStatus {
  ACTIVE = 'active',
  IMPROVING = 'improving',
  MASTERED = 'mastered',
  NEEDS_REVIEW = 'needs_review',
  RESOLVED = 'resolved',
  IGNORED = 'ignored',
}

export enum PrimaryGoal {
  EXAM_PREP = 'exam_prep',
  SKILL_BUILDING = 'skill_building',
  SCHOOL_SUPPORT = 'school_support',
  GENERAL_LEARNING = 'general_learning',
}

// ── 9. AI CHAT ────────────────────────────────────────────────────

export enum AiChatRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export enum AiChatSessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

// ── 10. NOTIFICATIONS ─────────────────────────────────────────────

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WHATSAPP = 'whatsapp',
}

export enum NotificationType {
  WELCOME = 'welcome',
  STREAK_ALERT = 'streak_alert',
  NEW_MESSAGE = 'new_message',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  RESULT_PUBLISHED = 'result_published',
  NEW_CONTENT = 'new_content',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  LEADERBOARD_UPDATE = 'leaderboard_update',
  ACCOUNT_ALERT = 'account_alert',
  WEEKLY_REPORT = 'weekly_report',
  SYSTEM = 'system',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
}

// ── 11. SETTINGS & PREFERENCES ───────────────────────────────────

export enum ThemePreference {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export enum FontSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large',
}

export enum DashboardLayout {
  DEFAULT = 'default',
  COMPACT = 'compact',
  EXPANDED = 'expanded',
  MINIMAL = 'minimal',
}

export enum PrivacyLevel {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private',
}

// ── 12. SUBJECTS ──────────────────────────────────────────────────

export enum Subject {
  // ── Core Sciences ──
  MATHEMATICS = 'mathematics',
  FURTHER_MATHEMATICS = 'further_mathematics',
  PHYSICS = 'physics',
  CHEMISTRY = 'chemistry',
  BIOLOGY = 'biology',
  GENERAL_SCIENCE = 'general_science',
  BASIC_SCIENCE = 'basic_science',
  INTEGRATED_SCIENCE = 'integrated_science',

  // ── English & Languages ──
  ENGLISH = 'english',
  ENGLISH_LITERATURE = 'english_literature',
  LITERATURE_IN_ENGLISH = 'literature_in_english',
  YORUBA = 'yoruba',
  HAUSA = 'hausa',
  IGBO = 'igbo',
  FRENCH = 'french',
  ARABIC = 'arabic',
  GERMAN = 'german',
  LATIN = 'latin',

  // ── Humanities & Social Sciences ──
  ECONOMICS = 'economics',
  GOVERNMENT = 'government',
  HISTORY = 'history',
  GEOGRAPHY = 'geography',
  CIVIC_EDUCATION = 'civic_education',
  SOCIAL_STUDIES = 'social_studies',
  RELIGIOUS_STUDIES = 'religious_studies',
  CHRISTIAN_RELIGIOUS_STUDIES = 'christian_religious_studies',
  ISLAMIC_RELIGIOUS_STUDIES = 'islamic_religious_studies',
  PHILOSOPHY = 'philosophy',
  PSYCHOLOGY = 'psychology',
  SOCIOLOGY = 'sociology',
  ANTHROPOLOGY = 'anthropology',

  // ── Commerce & Business ──
  COMMERCE = 'commerce',
  ACCOUNTING = 'accounting',
  BUSINESS_STUDIES = 'business_studies',
  BUSINESS_MANAGEMENT = 'business_management',
  MARKETING = 'marketing',
  INSURANCE = 'insurance',
  OFFICE_PRACTICE = 'office_practice',
  STORE_KEEPING = 'store_keeping',
  ENTREPRENEURSHIP = 'entrepreneurship',

  // ── Technical & Vocational ──
  TECHNICAL_DRAWING = 'technical_drawing',
  BUILDING_CONSTRUCTION = 'building_construction',
  WOODWORK = 'woodwork',
  METALWORK = 'metalwork',
  AUTO_MECHANICS = 'auto_mechanics',
  ELECTRICAL_INSTALLATION = 'electrical_installation',
  ELECTRONICS = 'electronics',
  COMPUTER_STUDIES = 'computer_studies',
  COMPUTER_SCIENCE = 'computer_science',
  DATA_PROCESSING = 'data_processing',
  INFORMATION_TECHNOLOGY = 'information_technology',
  PROGRAMMING = 'programming',
  WEB_DEVELOPMENT = 'web_development',

  // ── Arts & Creative ──
  FINE_ARTS = 'fine_arts',
  CREATIVE_ARTS = 'creative_arts',
  MUSIC = 'music',
  THEATRE_ARTS = 'theatre_arts',
  DANCE = 'dance',
  CULTURAL_AND_CREATIVE_ARTS = 'cultural_and_creative_arts',

  // ── Home Economics & Practical ──
  HOME_ECONOMICS = 'home_economics',
  FOOD_AND_NUTRITION = 'food_and_nutrition',
  TEXTILES = 'textiles',
  CLOTHING_AND_TEXTILES = 'clothing_and_textiles',
  CATERING = 'catering',
  HOSPITALITY = 'hospitality',

  // ── Agriculture ──
  AGRICULTURAL_SCIENCE = 'agricultural_science',
  ANIMAL_HUSBANDRY = 'animal_husbandry',
  CROP_PRODUCTION = 'crop_production',
  FISHERIES = 'fisheries',
  FORESTRY = 'forestry',

  // ── Health & Physical ──
  HEALTH_EDUCATION = 'health_education',
  PHYSICAL_EDUCATION = 'physical_education',
  HUMAN_KINETICS = 'human_kinetics',
  NUTRITION = 'nutrition',
  PUBLIC_HEALTH = 'public_health',
  // ── Professional Exams: ICAN — Foundation ──
  QUANTITATIVE_TECHNIQUES = 'quantitative_techniques',
  BUSINESS_AND_FINANCE = 'business_and_finance',
  FINANCIAL_ACCOUNTING = 'financial_accounting',
  MANAGEMENT_INFORMATION = 'management_information',
  BUSINESS_LAW = 'business_law',

  // ── Professional Exams: ICAN — Skills ──
  AUDIT = 'audit',
  FINANCIAL_REPORTING = 'financial_reporting',
  TAXATION = 'taxation',
  MANAGEMENT_ACCOUNTING = 'management_accounting',
  BUSINESS_COMMUNICATION = 'business_communication',

  // ── Professional Exams: ICAN — Professional ──
  CORPORATE_REPORTING = 'corporate_reporting',
  ADVANCED_AUDIT = 'advanced_audit',
  STRATEGIC_FINANCIAL_MANAGEMENT = 'strategic_financial_management',
  ADVANCED_TAXATION = 'advanced_taxation',
  ETHICS_AND_GOVERNANCE = 'ethics_and_governance',

  // ── Professional Exams: NMCN — Basic ──
  ANATOMY = 'anatomy',
  PHYSIOLOGY = 'physiology',
  MICROBIOLOGY = 'microbiology',
  NUTRITION_AND_DIETETICS = 'nutrition_and_dietetics',
  PHARMACOLOGY = 'pharmacology',
  NURSING_FUNDAMENTALS = 'nursing_fundamentals',
  COMMUNITY_HEALTH = 'community_health',

  // ── Professional Exams: NMCN — Post-Basic ──
  MEDICAL_SURGICAL_NURSING = 'medical_surgical_nursing',
  PAEDIATRIC_NURSING = 'paediatric_nursing',
  OBSTETRIC_NURSING = 'obstetric_nursing',
  MENTAL_HEALTH_NURSING = 'mental_health_nursing',
  ACCIDENT_EMERGENCY_NURSING = 'accident_emergency_nursing',

  // ── Professional Exams: NMCN — Advanced ──
  ADVANCED_CLINICAL_NURSING = 'advanced_clinical_nursing',
  NURSING_RESEARCH_AND_EDUCATION = 'nursing_research_and_education',
  NURSING_ADMINISTRATION = 'nursing_administration',
  NURSE_PRESCRIBING = 'nurse_prescribing',
  MIDWIFERY = 'midwifery', // retained

  // ── Professional Exams: CIPM — Associate ──
  ORGANISATIONAL_BEHAVIOUR = 'organisational_behaviour',
  HUMAN_RESOURCE_MANAGEMENT = 'human_resource_management',
  EMPLOYMENT_LAW = 'employment_law',
  LEARNING_AND_DEVELOPMENT = 'learning_and_development',
  COMPENSATION_AND_BENEFITS = 'compensation_and_benefits',

  // ── Professional Exams: CIPM — Chartered ──
  STRATEGIC_HRM = 'strategic_hrm',
  LABOUR_RELATIONS = 'labour_relations',
  HR_METRICS_AND_ANALYTICS = 'hr_metrics_and_analytics',
  ORGANISATIONAL_DEVELOPMENT = 'organisational_development',
  PERFORMANCE_MANAGEMENT = 'performance_management',

  // ── Professional Exams: CIPM — Fellow ──
  LEADERSHIP_AND_CORPORATE_GOVERNANCE = 'leadership_and_corporate_governance',
  ADVANCED_STRATEGIC_HRM = 'advanced_strategic_hrm',
  HR_CONSULTING = 'hr_consulting',

  // ── Professional Exams: NIM — Diploma ──
  PRINCIPLES_OF_MANAGEMENT = 'principles_of_management',
  ECONOMICS_FOR_MANAGERS = 'economics_for_managers',
  ACCOUNTING_FOR_NON_ACCOUNTANTS = 'accounting_for_non_accountants',
  MARKETING_MANAGEMENT = 'marketing_management',

  // ── Professional Exams: NIM — Graduate ──
  STRATEGIC_MANAGEMENT = 'strategic_management',
  OPERATIONS_MANAGEMENT = 'operations_management',
  FINANCIAL_MANAGEMENT = 'financial_management',
  ENTREPRENEURSHIP_AND_INNOVATION = 'entrepreneurship_and_innovation',

  // ── Professional Exams: NIM — Fellow ──
  CORPORATE_GOVERNANCE = 'corporate_governance',
  ADVANCED_STRATEGIC_MANAGEMENT = 'advanced_strategic_management',
  EXECUTIVE_LEADERSHIP = 'executive_leadership',

  // ── Professional Exams: NIESV — Foundation ──
  LAND_LAW_AND_ADMINISTRATION = 'land_law_and_administration',
  BUILDING_CONSTRUCTION_AND_TECHNOLOGY = 'building_construction_and_technology',
  VALUATION_PRINCIPLES = 'valuation_principles',
  TOWN_PLANNING = 'town_planning',
  ECONOMICS_OF_PROPERTY = 'economics_of_property',

  // ── Professional Exams: NIESV — Professional ──
  ADVANCED_VALUATION = 'advanced_valuation',
  PROPERTY_MANAGEMENT = 'property_management',
  ESTATE_AGENCY_AND_MARKETING = 'estate_agency_and_marketing',
  FACILITIES_MANAGEMENT = 'facilities_management',
  DISPUTE_RESOLUTION_AND_ARBITRATION = 'dispute_resolution_and_arbitration',
  REAL_ESTATE_FINANCE = 'real_estate_finance',

  // ── Professional Exams: Engineering ──
  ENGINEERING_MATHEMATICS = 'engineering_mathematics',
  STRENGTH_OF_MATERIALS = 'strength_of_materials',
  FLUID_MECHANICS = 'fluid_mechanics',
  THERMODYNAMICS = 'thermodynamics',
  STRUCTURAL_ANALYSIS = 'structural_analysis',
  GEOTECHNICAL_ENGINEERING = 'geotechnical_engineering',
  ELECTRICAL_CIRCUITS = 'electrical_circuits',
  DIGITAL_ELECTRONICS = 'digital_electronics',
  CONTROL_ENGINEERING = 'control_engineering',
  TELECOMMUNICATIONS = 'telecommunications',

  // ── Professional Exams: Law ──
  CONSTITUTIONAL_LAW = 'constitutional_law',
  CRIMINAL_LAW = 'criminal_law',
  CONTRACT_LAW = 'contract_law',
  TORT_LAW = 'tort_law',
  PROPERTY_LAW = 'property_law',
  COMPANY_LAW = 'company_law',
  CORPORATE_LAW = 'corporate_law',
  EVIDENCE_LAW = 'evidence_law',

  // ── Advanced & Specialized ──
  STATISTICS = 'statistics',
  QUANTITATIVE_METHODS = 'quantitative_methods',
  OPERATIONS_RESEARCH = 'operations_research',
  PROJECT_MANAGEMENT = 'project_management',
  RESEARCH_METHODS = 'research_methods',
  LOGIC = 'logic',
  ETHICS = 'ethics',
  BIOCHEMISTRY = 'biochemistry',
  PATHOLOGY = 'pathology',
  // ── Test Prep ──
  VERBAL_REASONING = 'verbal_reasoning',
  QUANTITATIVE_REASONING = 'quantitative_reasoning',
  GENERAL_KNOWLEDGE = 'general_knowledge',
  CURRENT_AFFAIRS = 'current_affairs',
  IQ_TEST = 'iq_test',
  APTITUDE_TEST = 'aptitude_test',
}

// ── 13. LOCATION ──────────────────────────────────────────────────

export enum NigerianState {
  ABIA = 'Abia',
  ADAMAWA = 'Adamawa',
  AKWA_IBOM = 'Akwa Ibom',
  ANAMBRA = 'Anambra',
  BAUCHI = 'Bauchi',
  BAYELSA = 'Bayelsa',
  BENUE = 'Benue',
  BORNO = 'Borno',
  CROSS_RIVER = 'Cross River',
  DELTA = 'Delta',
  EBONYI = 'Ebonyi',
  EDO = 'Edo',
  EKITI = 'Ekiti',
  ENUGU = 'Enugu',
  GOMBE = 'Gombe',
  IMO = 'Imo',
  JIGAWA = 'Jigawa',
  KADUNA = 'Kaduna',
  KANO = 'Kano',
  KATSINA = 'Katsina',
  KEBBI = 'Kebbi',
  KOGI = 'Kogi',
  KWARA = 'Kwara',
  LAGOS = 'Lagos',
  NASARAWA = 'Nasarawa',
  NIGER = 'Niger',
  OGUN = 'Ogun',
  ONDO = 'Ondo',
  OSUN = 'Osun',
  OYO = 'Oyo',
  PLATEAU = 'Plateau',
  RIVERS = 'Rivers',
  SOKOTO = 'Sokoto',
  TARABA = 'Taraba',
  YOBE = 'Yobe',
  ZAMFARA = 'Zamfara',
  FCT_ABUJA = 'Federal Capital Territory',
}

// ==========================AI RELATED ===========================

export enum AIFeature {
  SABI_TUTOR = 'sabi_tutor', // free-form chat tutoring
  SABI_EXPLAIN = 'sabi_explain', // on-demand MCQ explanation
  SABI_SOLVE = 'sabi_solve', // step-by-step problem solving (reserved)
  SABI_QUIZ = 'sabi_quiz', // AI-generated practice quiz (reserved)
  SABI_ESSAY = 'sabi_essay', // essay/theory writing help, not scoring (reserved)
  SABI_TRANSLATE = 'sabi_translate', // pidgin/local-language translation (reserved)
  PRACTICE_SCORING = 'practice_scoring', // essay/theory scoring in practice mode
  EXAM_GRADING = 'exam_grading', // essay/theory scoring in exam mode
  FEEDBACK_GENERATION = 'feedback_generation', // reserved
}

export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  DEEPSEEK = 'deepseek',
  MISTRAL = 'mistral',
  GROQ = 'groq',
  // Aggregator giving access to hundreds of models (including several
  // genuinely free ones) through one OpenAI-compatible API and key —
  // useful as a cost-arbitrage option or a quick way to trial a new
  // model without provisioning a whole new provider account.
  OPENROUTER = 'openrouter',
  // Self-hosted, zero-marginal-cost inference (Llama, Mistral, Qwen,
  // DeepSeek, etc. run on the operator's own hardware). Same
  // OpenAI-compatible /chat/completions shape as the others, just
  // pointed at a local/private base URL instead of a paid API.
  OLLAMA = 'ollama',
}

export enum AIConversationStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  FLAGGED = 'flagged',
}

export enum AIMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export enum TutorDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum TutorResponseStyle {
  DETAILED = 'detailed',
  CONCISE = 'concise',
  EXAMPLES = 'examples',
  SOCRATIC = 'socratic', // proposed 4th option — your SettingsPanel.tsx only
  // showed 3 (detailed/concise/examples); confirm if you want this one too
  // or if there's a different 4th value you had in mind.
}

// NOTE: These are scoped to the notifications module for now. If you keep
// all enums centralized in src/common/enums/enums.ts, move these there and
// update the two imports below (admin-broadcast.entity.ts and
// admin-broadcast.dto.ts) accordingly — nothing else needs to change.

export enum BroadcastAudienceType {
  ALL = 'all',
  SEGMENT = 'segment',
  SPECIFIC = 'specific',
}

export enum BroadcastStatus {
  QUEUED = 'queued', // scheduled, not yet executed
  SENDING = 'sending', // execution in progress
  SENT = 'sent', // completed successfully (or with partial failures — see errorMessage)
  FAILED = 'failed', // execution failed entirely
}

// ─── ADMIN OPERATIONAL ALERTS ───────────────────────────────────────────
// Deliberately separate from NotificationType/Notification above.
// NotificationType + Notification model "platform -> end user" messages.
// AdminAlert models "system -> admin operator" alerts (fraud, signups,
// disputes, infra health) — a different audience and a different shape
// (priority + resolved-tracking instead of channels + user preferences).
// Merging them would mean either polluting NotificationType with alert
// types no student should ever be able to receive, or silently mislabeling
// alerts as if they were user-facing notifications — this enum exists so
// neither has to happen.
export enum AdminAlertType {
  USER_SIGNUP = 'user_signup',
  USER_REPORT = 'user_report',
  PAYMENT_DISPUTE = 'payment_dispute',
  SYSTEM_ALERT = 'system_alert',
  BACKUP_COMPLETED = 'backup_completed',
  HIGH_USAGE_ALERT = 'high_usage_alert',
  FRAUD_ALERT = 'fraud_alert',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  SERVER_STATUS = 'server_status',
  DATABASE_BACKUP = 'database_backup',
  NEW_FEATURE = 'new_feature',
  ADMIN_ACTION = 'admin_action',
}

export enum AdminAlertPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// Same three states as NotificationStatus (unread/read/archived) — kept as
// its own enum rather than reusing NotificationStatus so AdminAlert's
// Postgres enum type can evolve independently (e.g. adding a "resolved"
// status later) without touching the user-notification schema.
export enum AdminAlertStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
}

// ─── CONTENT AUDIT LOG ───────────────────────────────────────────────────
// One row per admin action taken on a LibraryContent record — backs the
// "Activity" tab on the admin content detail page. Deliberately only
// covers actions that correspond to a real LibraryService method (see
// ContentAuditLogService.log() call sites) — no "featured"/"unfeatured"
// action exists here because LibraryContent has no isFeatured column.
export enum ContentAuditAction {
  UPLOADED = 'uploaded',
  EDITED = 'edited',
  PUBLISHED = 'published',
  UNPUBLISHED = 'unpublished',
  DELETED = 'deleted',
  ACCESS_GRANTED = 'access_granted',
  ACCESS_REVOKED = 'access_revoked',
  PRICE_CHANGED = 'price_changed',
}

// Lifecycle of a generated free-preview clip/excerpt for gated (non-free)
// library content — see LibraryContentPreview + LibraryPreviewService.
export enum ContentPreviewStatus {
  NONE = 'none', // never requested
  PENDING = 'pending', // job queued/running
  READY = 'ready',
  FAILED = 'failed',
  NOT_APPLICABLE = 'not_applicable', // free content, or too short to preview safely
}

// ─── BLOG ──────────────────────────────────────────────────────────────
export enum BlogCategory {
  JAMB = 'jamb',
  WAEC = 'waec',
  STUDY_TIPS = 'study-tips',
  AI_LEARNING = 'ai-learning',
  SUCCESS_STORIES = 'success-stories',
}
