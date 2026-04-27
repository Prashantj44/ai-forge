/**
 * Evaluation Dataset — 20 test prompts
 * 
 * 10 Real Product Prompts + 10 Edge Cases
 * Each with expected characteristics for validation.
 */

export const testDataset = [
  // ============================================================
  // REAL PRODUCT PROMPTS (10)
  // ============================================================
  {
    id: "rp-01",
    category: "real",
    prompt: "Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments. Admins can see analytics.",
    expectedFeatures: ["auth", "contacts", "dashboard", "rbac", "payments", "analytics"],
    expectedRoles: ["admin", "user"],
    expectedComplexity: "high",
  },
  {
    id: "rp-02",
    category: "real",
    prompt: "Create a project management tool with kanban boards, team members, task assignments, deadlines, and file attachments. Team leads can create projects, members can only view and update their tasks.",
    expectedFeatures: ["kanban", "teams", "tasks", "deadlines", "files"],
    expectedRoles: ["team_lead", "member"],
    expectedComplexity: "high",
  },
  {
    id: "rp-03",
    category: "real",
    prompt: "Build an e-commerce store with product catalog, shopping cart, checkout with Stripe payments, order tracking, and an admin panel for managing products and orders.",
    expectedFeatures: ["products", "cart", "checkout", "payments", "orders", "admin"],
    expectedRoles: ["admin", "customer"],
    expectedComplexity: "high",
  },
  {
    id: "rp-04",
    category: "real",
    prompt: "Blog platform with user registration, post creation with rich text editor, comments, categories and tags, and an admin moderation panel.",
    expectedFeatures: ["auth", "posts", "comments", "categories", "moderation"],
    expectedRoles: ["admin", "author", "reader"],
    expectedComplexity: "medium",
  },
  {
    id: "rp-05",
    category: "real",
    prompt: "Restaurant reservation system with table management, online booking, menu display, customer reviews, and staff scheduling for managers.",
    expectedFeatures: ["tables", "reservations", "menu", "reviews", "scheduling"],
    expectedRoles: ["manager", "staff", "customer"],
    expectedComplexity: "medium",
  },
  {
    id: "rp-06",
    category: "real",
    prompt: "Fitness tracker app with workout logging, exercise library, progress charts, goal setting, and social feature where users can follow each other and share workouts.",
    expectedFeatures: ["workouts", "exercises", "progress", "goals", "social"],
    expectedRoles: ["user"],
    expectedComplexity: "medium",
  },
  {
    id: "rp-07",
    category: "real",
    prompt: "Invoice management system with client database, invoice creation and sending, payment tracking, expense reports, and tax calculation. Accountants and business owners have different access levels.",
    expectedFeatures: ["clients", "invoices", "payments", "expenses", "tax", "reports"],
    expectedRoles: ["owner", "accountant"],
    expectedComplexity: "high",
  },
  {
    id: "rp-08",
    category: "real",
    prompt: "Job board with company profiles, job postings, candidate applications with resume upload, search with filters, and an admin dashboard showing hiring metrics.",
    expectedFeatures: ["companies", "jobs", "applications", "search", "dashboard"],
    expectedRoles: ["admin", "employer", "candidate"],
    expectedComplexity: "high",
  },
  {
    id: "rp-09",
    category: "real",
    prompt: "Event management platform where organizers can create events, sell tickets, manage attendees, send email notifications, and view analytics. Attendees can browse events and purchase tickets.",
    expectedFeatures: ["events", "tickets", "attendees", "notifications", "analytics"],
    expectedRoles: ["organizer", "attendee"],
    expectedComplexity: "high",
  },
  {
    id: "rp-10",
    category: "real",
    prompt: "Learning management system with courses, lessons, video content, quizzes with auto-grading, student progress tracking, certificates, and instructor analytics.",
    expectedFeatures: ["courses", "lessons", "videos", "quizzes", "progress", "certificates"],
    expectedRoles: ["admin", "instructor", "student"],
    expectedComplexity: "high",
  },

  // ============================================================
  // EDGE CASES (10)
  // ============================================================
  {
    id: "ec-01",
    category: "vague",
    prompt: "Make me an app",
    expectedBehavior: "Should ask for clarification or make reasonable assumptions",
    expectedComplexity: "low",
  },
  {
    id: "ec-02",
    category: "vague",
    prompt: "Something for my business",
    expectedBehavior: "Should generate generic business tool with clarification requests",
    expectedComplexity: "low",
  },
  {
    id: "ec-03",
    category: "conflicting",
    prompt: "Build a public app where all data is private but everyone can see everything, and it should be free but require a paid subscription.",
    expectedBehavior: "Should resolve conflicts with reasonable assumptions and document them",
    expectedComplexity: "medium",
  },
  {
    id: "ec-04",
    category: "conflicting",
    prompt: "Create a free premium app with exclusive paid features that are also available for free to all users.",
    expectedBehavior: "Should resolve the free/paid conflict with assumptions",
    expectedComplexity: "low",
  },
  {
    id: "ec-05",
    category: "incomplete",
    prompt: "Dashboard",
    expectedBehavior: "Should build a generic dashboard and list ambiguities",
    expectedComplexity: "low",
  },
  {
    id: "ec-06",
    category: "overly-complex",
    prompt: "Build a super app with social media, e-commerce, ride sharing, food delivery, banking, video streaming, music player, dating, news aggregator, fitness tracking, project management, email client, calendar, note taking, and weather forecasting — all in one app with seamless integration between every feature.",
    expectedBehavior: "Should handle gracefully, possibly simplify or document scope decisions",
    expectedComplexity: "high",
  },
  {
    id: "ec-07",
    category: "mixed-language",
    prompt: "Build a student management ऐप with attendance tracking and grade reports",
    expectedBehavior: "Should handle mixed language input and extract intent correctly",
    expectedComplexity: "medium",
  },
  {
    id: "ec-08",
    category: "contradictory-roles",
    prompt: "Create an admin panel where admins cannot see the admin panel but regular users can manage all admin settings.",
    expectedBehavior: "Should resolve role contradictions with assumptions",
    expectedComplexity: "medium",
  },
  {
    id: "ec-09",
    category: "impossible",
    prompt: "Build an app that predicts future stock prices with 100% accuracy and guarantees profit on every trade.",
    expectedBehavior: "Should flag impossibility, suggest realistic alternatives",
    expectedComplexity: "medium",
  },
  {
    id: "ec-10",
    category: "ambiguous-scope",
    prompt: "Like Uber but for dogs",
    expectedBehavior: "Should interpret creatively (dog walking? pet transportation?) and document assumptions",
    expectedComplexity: "medium",
  },
];
