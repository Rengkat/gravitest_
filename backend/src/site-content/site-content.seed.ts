/**
 * One-time starter content for the public website.
 *
 * This is what the frontend used to hardcode. It is copied into the database
 * on the very first boot (see SiteContentService.onApplicationBootstrap) so
 * the site doesn't launch blank — and then the database is the only source of
 * truth. Editing this file later changes nothing on a live system; use the
 * admin dashboard.
 *
 * Deliberately NOT seeded because they were placeholders, not real content:
 *   - demo video tutorials (no video links, no thumbnails existed)
 *   - the video-page "impact" stats (50+ tutorials, 15,000+ trained, 4.9/5) — unverifiable;
 *     the admin can add real figures
 *   - the live-chat contact option (no chat widget exists)
 *   - a WhatsApp contact using a dummy phone number
 *   - help-centre stats ("120+ articles", "4.9/5 satisfaction") — unverifiable
 *   - help article pages: the old links pointed at /help/... routes that never existed,
 *     so articles are listed by title only until an admin writes their content
 */

type Row = Record<string, unknown>;

export const SEED_BLOCKS: Record<string, Row> = {
  'site.contact': {
    supportEmail: 'support@gravitest.ng',
    salesEmail: 'support@gravitest.ng',
    supportHours: 'Monday–Friday, 8am–8pm WAT',
  },
  'site.social': {
    links: [
      { platform: 'twitter', url: 'https://twitter.com/Gravitest' },
      { platform: 'linkedin', url: 'https://linkedin.com/company/Gravitest' },
      { platform: 'instagram', url: 'https://instagram.com/Gravitest' },
      { platform: 'youtube', url: 'https://youtube.com/@Gravitest' },
    ],
  },
  'site.footer': {
    tagline:
      "Nigeria's AI-powered exam preparation platform. Built for every student, from SS1 to professional certifications.",
    columns: [
      {
        title: 'Platform',
        links: [
          { label: 'JAMB CBT Simulator', href: '/features/jamb' },
          { label: 'WAEC / NECO Practice', href: '/features/waec' },
          { label: 'Post-UTME Suite', href: '/features/post-utme' },
          { label: 'ICAN & Nursing', href: '/features/professional' },
          { label: 'Content Library', href: '/library' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About Gravitest', href: '/about' },
          { label: 'Blog', href: '/blog' },
          { label: 'Careers', href: '/careers' },
          { label: 'Press Kit', href: '/press' },
          { label: 'Contact Us', href: '/contact' },
          { label: 'Help Centre', href: '/help-centre' },
        ],
      },
    ],
    legalLinks: [
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Terms of Service', href: '/legal/terms' },
      { label: 'Cookie Policy', href: '/legal/cookies' },
    ],
    copyright: 'Gravitest Technologies Ltd. Made with ❤️ in Nigeria.',
  },

  'home.hero': {
    badge: 'JAMB · WAEC · ICAN · Nursing & more',
    titleLead: 'Practice the exam',
    titleHighlight: "you're actually sitting",
    subtitle:
      'Gravitest mirrors the real JAMB and WAEC CBT screens, question format and all, so nothing about test day catches you off guard. Every wrong answer comes with a worked explanation, and it all runs fine on 2G.',
    primaryCtaLabel: 'Start practising free',
    primaryCtaHref: '/register',
    secondaryCtaLabel: '',
    secondaryCtaHref: '',
    trustNote: '',
  },
  'home.stats': {
    items: [
      { icon: '', value: '50k+', label: 'Past Questions' },
      { icon: '', value: '12k', label: 'Active Students' },
      { icon: '', value: '94%', label: 'Pass Rate' },
      { icon: '', value: '8', label: 'Exam Types Covered' },
    ],
  },
  'home.features': {
    eyebrow: 'Why Gravitest',
    title: 'Built around how Nigerian students actually study.',
    subtitle:
      'Five tools tuned for real exam halls, real networks, and real syllabuses — not a generic study app with JAMB slapped on it.',
    items: [
      {
        icon: 'Monitor',
        title: 'Exact CBT Interface Replication',
        description:
          'Practice on a pixel-perfect replica of the real JAMB, WAEC 2026 Digital, and ICAN interfaces. Walk into the exam hall and feel zero surprise.',
        tag: 'Same screens as test day',
        featured: true,
      },
      {
        icon: 'Sparkles',
        title: 'Sabi-Explain AI',
        description:
          "Every wrong answer triggers an instant AI breakdown using Nigerian syllabus context, local examples — even in Pidgin if you prefer.",
        tag: "Explained the way you'd ask a friend",
      },
      {
        icon: 'BarChart3',
        title: 'Deep Performance Analytics',
        description:
          "Track weak topics, time per question, and score trajectory across every mock. Know exactly where you're losing marks.",
        tag: 'Down to the question',
      },
      {
        icon: 'WifiOff',
        title: 'Works on 2G & Offline',
        description:
          'Download question banks and video lessons. Practice on the bus, in your village — even with zero data after download.',
        tag: 'Zero data after download',
      },
      {
        icon: 'Flame',
        title: 'Streaks, XP & Leaderboards',
        description:
          'Daily study streaks, subject XP points, and national leaderboards make preparation feel like a competition.',
        tag: 'National leaderboard, real names',
      },
    ],
  },
  'home.exam-modules': {
    eyebrow: 'Exam Modules',
    title: "Every exam you'll ever face. One platform.",
    subtitle: '',
    items: [
      {
        badge: 'JAMB / UTME',
        name: 'JAMB CBT Simulator',
        description:
          'Exact JAMB interface. 10+ years of past questions. Mock scheduling with real exam conditions.',
        tags: ['40,000+ questions', '10 years'],
        href: '',
      },
      {
        badge: 'WAEC / NECO',
        name: 'WAEC & NECO CBT',
        description:
          "Objective AND theory/essay. WAEC's new 2026 digital interface. AI-powered marking for essays.",
        tags: ['Obj + Theory', '2026 Ready'],
        href: '',
      },
      {
        badge: 'Post-UTME',
        name: 'Post-UTME Suite',
        description:
          "University-specific questions for UNILAG, UI, OAU, ABU, UNIBEN and 40+ more. Each school's format respected.",
        tags: ['40+ universities', 'Cut-off tracker'],
        href: '',
      },
      {
        badge: 'Professional',
        name: 'ICAN & Nursing',
        description:
          'MCQ and essay for ICAN (2025/26 syllabus) and Nursing Council certifications with AI grading.',
        tags: ['2025/26 syllabus', 'AI grading'],
        href: '',
      },
    ],
  },
  'home.how-it-works': {
    eyebrow: 'How It Works',
    title: 'From signup to exam day in 4 steps',
    subtitle: 'No tutorials to watch. No complicated setup. Just pick your exam and start.',
    items: [
      { title: 'Create Your Account', description: 'Sign up free in 30 seconds with email or phone. No credit card needed.' },
      { title: 'Choose Your Exam', description: 'Select JAMB, WAEC, Post-UTME, or professional exams. Set your target score and exam date.' },
      { title: 'Practice & Improve', description: 'Timed mock exams. Instant AI explanations. Track weak topics and fill the gaps.' },
      { title: 'Walk In Confident', description: 'Enter the exam hall having seen the exact interface hundreds of times. No surprises.' },
    ],
  },
  'home.ai-tutor': {
    eyebrow: 'AI Gravitest-Tutor',
    title: 'Your personal tutor. Available 24/7. Speaks Pidgin.',
    subtitle:
      'Explains concepts using examples from your world — garri, danfo, market prices. Familiar. Memorable.',
    items: [
      {
        icon: 'BarChart2',
        title: 'Post-Exam Post-Mortem',
        description:
          '"You got 8/10 Quadratic Equations questions wrong. Here\'s your 2-minute refresher." Not just a score — a direction.',
      },
      {
        icon: 'Mic',
        title: 'Voice & Pidgin Input',
        description:
          'Speak your question in English or Pidgin. Works on cheap Android phones. No typing needed.',
      },
      {
        icon: 'Infinity',
        title: 'Endless Practice Generation',
        description:
          "AI generates unlimited new questions on your weakest topics. You'll never run out of material.",
      },
    ],
  },
  'home.testimonials': {
    eyebrow: 'Student Stories',
    title: 'From "I\'m not sure" to "I scored 312."',
    subtitle: '',
  },
  'home.cta': {
    title: 'Your exam date is coming.',
    titleHighlight: 'Are you ready?',
    subtitle:
      'Join 12,000+ Nigerian students already practising on Gravitest. Start free — no credit card, no data wasted.',
    buttonLabel: 'Start Free Today',
    buttonHref: '/register',
    secondaryButtonLabel: 'Talk to Our Team',
    secondaryButtonHref: '/help-centre',
  },

  'community.page': {
    heroTitleLead: 'Join 12,000+ students on',
    heroTitleHighlight: 'WhatsApp & Telegram',
    heroSubtitle:
      'Connect with peers, get study tips, and stay updated on exam news. Join the fastest-growing student community in Nigeria.',
    stats: [
      { icon: 'Users', value: '12,000+', label: 'Active Members' },
      { icon: 'MessageCircle', value: '500+', label: 'Daily Messages' },
      { icon: 'Share2', value: '24/7', label: 'Peer Support' },
      { icon: 'Zap', value: '10 mins', label: 'Avg Response Time' },
    ],
    benefitsTitle: "What you'll get as a member",
    benefitsSubtitle: "More than just a group — it's your support system for exam success.",
    benefits: [
      { icon: 'CheckCircle', title: 'Study Tips & Strategies', description: 'Get proven techniques from top-scoring students and past exam high-scorers.' },
      { icon: 'MessageSquare', title: 'Live Q&A Sessions', description: 'Weekly sessions with subject matter experts and past exam high-scorers.' },
      { icon: 'Users2', title: 'Study Groups', description: 'Connect with peers preparing for the same exams and form accountability groups.' },
      { icon: 'Globe', title: 'Exam Updates', description: 'Be the first to know about JAMB, WAEC, and NECO announcements.' },
      { icon: 'Shield', title: 'Safe & Moderated', description: 'Active moderation ensures a supportive, spam-free learning environment.' },
      { icon: 'Smartphone', title: 'Mobile Friendly', description: 'Join and participate directly from your phone — no extra apps needed.' },
    ],
    rulesTitle: 'Safe space for learning',
    rulesSubtitle: 'We keep our communities respectful, helpful, and spam-free.',
    rules: [
      'Be respectful to all members',
      'No spam or promotional content',
      'Stay on topic (exam prep & education)',
      'Help others when you can',
      'No hate speech or bullying',
      'Share resources that add value',
    ],
    ctaTitle: 'Ready to join',
    ctaTitleHighlight: '12,000+ students?',
    ctaSubtitle: 'Choose your preferred platform and start connecting with fellow students today.',
  },

  'videos.page': {
    heroTitle: 'How to use Gravitest',
    heroTitleHighlight: '+ Exam Prep Masterclasses',
    heroSubtitle:
      'Watch step-by-step tutorials, masterclass sessions, and get expert tips to ace your exams.',
    featuredTitle: 'Boost Your Score with Expert-Led Sessions',
    statsTitle: '',
    stats: [],
    ctaTitle: 'Ready to master',
    ctaTitleHighlight: 'your exams?',
    ctaSubtitle: 'Start watching tutorials and join 12,000+ students already preparing with Gravitest.',
    ctaButtonLabel: 'Start Free Today',
    ctaButtonHref: '/register',
    ctaSecondaryLabel: 'Visit Help Centre',
    ctaSecondaryHref: '/help-centre',
  },

  'help.page': {
    heroTitle: 'How can we help you?',
    heroSubtitle: 'Search our docs, browse categories, or ask our team directly.',
    popularLinks: [],
    stats: [],
    categoriesTitle: 'Find answers by category',
    faqTitle: 'Frequently asked questions',
    faqSubtitle: "Can't find the answer?",
    contactTitle: 'Our team is here for you',
    contactOptions: [
      {
        icon: 'Mail',
        title: 'Email Support',
        description: 'Send us a detailed message. We respond within 4 hours on business days.',
        ctaLabel: 'Send an email →',
        href: 'mailto:support@gravitest.ng',
        primary: true,
      },
    ],
    ctaTitle: 'Ready to get back',
    ctaTitleHighlight: 'to studying?',
    ctaSubtitle: '12,000+ students are already preparing with Gravitest. Start free — no credit card needed.',
    ctaButtonLabel: 'Start Practising Free →',
    ctaButtonHref: '/register',
  },

  'pricing.page': {
    heroTitle: 'Simple pricing.',
    heroTitleHighlight: 'Big results.',
    heroSubtitle:
      "Start free. Upgrade when you're ready. No hidden fees, no tricks, no \"gotcha\" moments.",
    trustItems: [
      { icon: 'Lock', text: 'No credit card required' },
      { icon: 'RefreshCw', text: 'Cancel anytime' },
      { icon: 'Smartphone', text: 'Works on any Android device' },
      { icon: 'Zap', text: 'Instant account activation' },
      { icon: 'Flag', text: 'Made for Nigeria' },
    ],
    faqTitle: 'Frequently Asked Questions',
    faqSubtitle: 'Everything you need to know about Gravitest pricing and plans.',
    faqStats: [
      { icon: 'Clock', value: '< 2 mins', label: 'Avg Response Time' },
      { icon: 'Shield', value: '30 Days', label: 'Money-Back Guarantee' },
      { icon: 'BookOpen', value: '24/7', label: 'Access to Resources' },
      { icon: 'Users', value: '12k+', label: 'Happy Students' },
    ],
    faqContactTitle: 'Still have questions?',
    faqContactText: "Can't find the answer you're looking for? Please chat with our friendly team.",
    ctaTitle: 'Your exam is closer than you think.',
    ctaTitleHighlight: 'Start today.',
    ctaSubtitle:
      'Join 12,000+ Nigerian students already practising on Gravitest. Free to start — no card, no tricks.',
    ctaButtonLabel: 'Start Free Today',
    ctaButtonHref: '/register',
    ctaSecondaryLabel: 'Talk to Our Team',
    ctaSecondaryHref: '/help-centre',
  },

  'blog.page': {
    heroEyebrow: 'The Gravitest Blog',
    heroTitle: 'Guides, tips & stories',
    heroTitleHighlight: 'to help you pass.',
    heroSubtitle:
      'JAMB strategies, WAEC guides, study science, and real student stories — written by Nigerian educators who know what it takes.',
    heroStats: [
      { value: '40+', label: 'Articles published' },
      { value: '12k+', label: 'Monthly readers' },
      { value: 'Free', label: 'Always free' },
    ],
    // The old sidebar had a "subscribe" box that never sent anything (it just
    // faked a success message), so it is a plain admin-managed promo card now.
    sidebarTitle: '',
    sidebarSubtitle: '',
    sidebarButtonLabel: '',
    sidebarButtonHref: '',
    popularTitle: 'Most Read',
    topicsTitle: 'Browse Topics',
    promoTitle: 'Ready to start practising?',
    promoText: 'Join 12,000+ students using Gravitest to pass JAMB and WAEC.',
    promoButtonLabel: 'Start Free',
    promoButtonHref: '/register',
    ctaEyebrow: 'Stop reading. Start practising.',
    ctaTitle: 'The best study tip is',
    ctaTitleHighlight: 'actually doing it.',
    ctaSubtitle:
      'Join 12,000+ Nigerian students already using Gravitest to put these strategies into practice. Free to start.',
    ctaButtonLabel: 'Start Free Today',
    ctaButtonHref: '/register',
    ctaSecondaryLabel: 'View Pricing',
    ctaSecondaryHref: '/pricing',
  },
};

export const SEED_ITEMS: Record<string, Row[]> = {
  'blog-categories': [
    { slug: 'jamb', label: 'JAMB Guide', icon: 'Target', gradient: 'deep-green' },
    { slug: 'waec', label: 'WAEC Guide', icon: 'Award', gradient: 'green' },
    { slug: 'study-tips', label: 'Study Tips', icon: 'Lightbulb', gradient: 'green' },
    { slug: 'ai-learning', label: 'AI Learning', icon: 'Brain', gradient: 'teal' },
    { slug: 'success-stories', label: 'Success Stories', icon: 'BarChart2', gradient: 'gold' },
  ],
  'video-categories': [
    { slug: 'getting-started', label: 'Getting Started', icon: 'GraduationCap' },
    { slug: 'cbt-practice', label: 'CBT Practice', icon: 'Target' },
    { slug: 'ai-features', label: 'AI Features', icon: 'Zap' },
    { slug: 'masterclasses', label: 'Masterclasses', icon: 'Trophy' },
    { slug: 'tips-tricks', label: 'Tips & Tricks', icon: 'TrendingUp' },
  ],
  'community-links': [
    {
      platform: 'WhatsApp',
      kind: 'whatsapp',
      members: '8,500+ active members',
      description:
        'Join our WhatsApp community for daily discussions, instant updates, and real-time peer support. Perfect for quick questions and staying connected on mobile.',
      inviteUrl: 'https://chat.whatsapp.com/Gravitest-community',
      buttonLabel: 'Join WhatsApp',
    },
    {
      platform: 'Telegram',
      kind: 'telegram',
      members: '3,500+ members',
      description:
        'Prefer Telegram? Join our Telegram channel for organized discussions, file sharing, and a more structured community experience. Get access to exclusive resources.',
      inviteUrl: 'https://t.me/Gravitest_community',
      buttonLabel: 'Join Telegram',
    },
  ],
  'help-categories': [
    {
      title: 'Getting Started', color: '#2E8B57', icon: 'Rocket',
      description: 'Create your account, set up your exam targets, and take your first mock.',
      articles: [
        { title: 'How to create a free account', slug: '', body: '', status: '' },
        { title: 'Choosing your exam type (JAMB, WAEC, Post-UTME)', slug: '', body: '', status: 'new' },
        { title: 'Taking your first practice session', slug: '', body: '', status: '' },
        { title: 'Setting a target score and exam date', slug: '', body: '', status: '' },
        { title: 'Using Gravitest on mobile devices', slug: '', body: '', status: '' },
      ],
    },
    {
      title: 'CBT Practice', color: '#1A4A2E', icon: 'FileText',
      description: 'Understand the exam interface, timers, question navigator, and practice modes.',
      articles: [
        { title: 'Practice vs Mock exam modes', slug: '', body: '', status: '' },
        { title: 'Using the question navigator', slug: '', body: '', status: '' },
        { title: 'Flagging questions for review', slug: '', body: '', status: '' },
        { title: 'How the exam timer works (and syncing)', slug: '', body: '', status: 'updated' },
        { title: 'Submitting your exam early', slug: '', body: '', status: '' },
        { title: 'WAEC / NECO essay (theory) mode guide', slug: '', body: '', status: 'new' },
      ],
    },
    {
      title: 'Sabi-Explain AI', color: '#F5C842', icon: 'Bot',
      description: 'Get the most out of AI-powered explanations and the Sabi-Tutor chat.',
      articles: [
        { title: 'How Sabi-Explain works', slug: '', body: '', status: '' },
        { title: 'Chatting with Sabi-Tutor', slug: '', body: '', status: '' },
        { title: 'Getting explanations in Pidgin English', slug: '', body: '', status: '' },
        { title: 'Using voice input on Android', slug: '', body: '', status: '' },
        { title: 'Reading your AI post-exam report', slug: '', body: '', status: 'new' },
      ],
    },
    {
      title: 'Performance & Analytics', color: '#6366F1', icon: 'BarChart3',
      description: 'Track your scores, find your weak topics, and understand your progress charts.',
      articles: [
        { title: 'Understanding your score dashboard', slug: '', body: '', status: '' },
        { title: 'How weak topics are identified', slug: '', body: '', status: '' },
        { title: 'Study streaks and XP explained', slug: '', body: '', status: '' },
        { title: 'National and subject leaderboards', slug: '', body: '', status: '' },
        { title: 'Exporting your results as PDF', slug: '', body: '', status: '' },
      ],
    },
    {
      title: 'Billing & Subscription', color: '#F59E0B', icon: 'CreditCard',
      description: 'Manage your plan, understand payments, cancel or upgrade at any time.',
      articles: [
        { title: 'Upgrading your plan', slug: '', body: '', status: '' },
        { title: 'How the annual plan and savings work', slug: '', body: '', status: '' },
        { title: 'Accepted payment methods', slug: '', body: '', status: '' },
        { title: 'Cancelling or pausing your subscription', slug: '', body: '', status: '' },
        { title: 'Refund policy and how to request one', slug: '', body: '', status: '' },
      ],
    },
    {
      title: 'Offline & Mobile', color: '#10B981', icon: 'Wifi',
      description: 'Download question banks, practice without data, and sync your answers.',
      articles: [
        { title: 'Enabling offline mode', slug: '', body: '', status: 'updated' },
        { title: 'Downloading question banks for offline use', slug: '', body: '', status: '' },
        { title: 'How offline answer syncing works', slug: '', body: '', status: '' },
        { title: 'Installing Gravitest as an app (PWA)', slug: '', body: '', status: '' },
      ],
    },
    {
      title: 'Account & Security', color: '#8B5CF6', icon: 'Lock',
      description: 'Password resets, phone OTP, profile settings, and account deletion.',
      articles: [
        { title: 'Resetting your password', slug: '', body: '', status: '' },
        { title: 'Updating your phone number', slug: '', body: '', status: '' },
        { title: 'Linking or unlinking Google login', slug: '', body: '', status: '' },
        { title: 'Deleting your account and data', slug: '', body: '', status: '' },
        { title: 'Setting up two-factor authentication', slug: '', body: '', status: '' },
      ],
    },
  ],
  // NOTE: the original answers quoted fixed prices (₦2,500/month, ₦20,000/year…).
  // Plan prices are now admin-managed, so those figures were removed here to
  // stop these answers contradicting the live pricing page.
  faqs: [
    {
      category: 'Getting Started',
      question: "Can I really use Gravitest for free? What's the catch?",
      answer:
        'Completely free, forever — no credit card, no trial expiry. The Free plan gives you a taste of the platform with basic performance stats. There is no catch. We want you to see real results before asking you for anything. If you want unlimited access and AI features, that is when a paid plan makes sense — see the Pricing page for current plans.',
      showOnPricing: true,
    },
    {
      category: 'CBT Practice',
      question: 'Is the JAMB interface exactly the same as the real exam?',
      answer:
        'Yes — our CBT interface is a pixel-perfect replica of the JAMB UTME interface, including the subject tab switching, the question navigator grid, the flag system, and the countdown timer. WAEC 2026 Digital mode is also replicated exactly, including the theory/essay section.',
      showOnPricing: false,
    },
    {
      category: 'Sabi-Explain AI',
      question: "What's the difference between Sabi-Explain and Sabi-Tutor?",
      answer:
        'Sabi-Explain is the instant AI popup that fires automatically after a wrong answer — it gives you a targeted breakdown of that specific question using Nigerian curriculum context. Sabi-Tutor is the full AI chat assistant you can open at any time to ask any question, request practice questions, or get concept explanations in Pidgin.',
      showOnPricing: false,
    },
    {
      category: 'Offline & Mobile',
      question: 'Does Gravitest work without internet?',
      answer:
        'Yes, on plans that include offline mode. Download your question banks while on Wi-Fi, then practice anywhere — on the bus, in your hostel, in a village with zero data. Your answers are queued locally and sync automatically when you come back online.',
      showOnPricing: false,
    },
    {
      category: 'Billing & Subscription',
      question: 'What payment methods do you accept?',
      answer:
        'You can pay securely at checkout with the payment methods shown there (such as Paystack and OPay). We do not require foreign cards.',
      showOnPricing: true,
    },
    {
      category: 'Account & Security',
      question: 'I forgot my password. How do I get back in?',
      answer:
        'Go to the login page and click "Forgot password?". Enter your email and we\'ll send a reset link within 2 minutes. If you signed up with your phone number, use the phone OTP option on the login page instead — you\'ll receive a 6-digit code by SMS.',
      showOnPricing: false,
    },
    {
      category: 'Performance & Analytics',
      question: 'How does Gravitest identify my weak topics?',
      answer:
        'After every session, our AI analyses your answer patterns across all questions. It tracks accuracy per topic, average time per question, and trends over your recent sessions, then flags the topics where you are weakest and prioritises them in the AI drill generator on your dashboard.',
      showOnPricing: false,
    },
    {
      category: 'Billing & Subscription',
      question: 'Can I switch from monthly to annual billing?',
      answer:
        'Yes! You can upgrade from monthly to annual billing at any time. Contact our support team or go to Settings → Billing to make the switch.',
      showOnPricing: true,
    },
    {
      category: 'Billing & Subscription',
      question: 'What happens when my subscription expires?',
      answer:
        "When your subscription expires, your account automatically reverts to the Free plan. You'll keep all your progress and data, but will lose access to paid features.",
      showOnPricing: true,
    },
    {
      category: 'Getting Started',
      question: 'Is there a contract or minimum commitment?',
      answer:
        "No contracts, no minimum commitment. Plans are prepaid and you can cancel anytime. After cancelling you won't be charged again, and you keep access until the end of the period you have already paid for.",
      showOnPricing: true,
    },
  ],
  testimonials: [
    {
      name: 'Adaeze Okonkwo',
      role: 'Medicine, University of Lagos',
      quote:
        'I failed JAMB twice before I found Gravitest. The Sabi-Explain feature changed everything — I finally understood why answers were wrong. Scored 312 on my third attempt.',
      avatar: '',
      score: '312 in JAMB 2024',
      featured: true,
    },
    {
      name: 'Kolade Adeyemi',
      role: 'SS3 Graduate, Ibadan',
      quote:
        'The essay practice mode with AI grading is insane. It told me exactly where I was losing marks in English — my sentence structure. Fixed it in 2 weeks.',
      avatar: '',
      score: "7 A's in WAEC",
      featured: false,
    },
    {
      name: 'Mercy Okafor',
      role: 'SS2 Student, Enugu',
      quote:
        'Data is expensive where I live, so I download my past questions on Wi-Fi at school and practice all weekend without spending a naira on data. Game changer.',
      avatar: '',
      score: 'Offline mode user',
      featured: false,
    },
  ],
};

/** Collections seeded as drafts: their content needs real values from the admin before going live. */
export const SEED_AS_DRAFT = new Set<string>(['community-links']);
