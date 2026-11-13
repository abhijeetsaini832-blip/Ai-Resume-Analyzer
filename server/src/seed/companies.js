/**
 * Seed data for company rubrics.
 * These are built from each company's publicly stated values and commonly
 * described interview/evaluation styles. They are approximations to guide
 * resume feedback, NOT official hiring criteria — keep them editable.
 */
const CompanyRubric = require('../models/CompanyRubric');

const DISCLAIMER =
  'Based on publicly stated values and commonly described hiring styles. Approximation for resume guidance — not official criteria.';

const companies = [
  {
    slug: 'amazon',
    name: 'Amazon',
    category: 'big-tech',
    tagline: 'Leadership Principles drive every hiring decision.',
    hiringStyle:
      'Behavioral, story-driven evaluation mapped to the Leadership Principles, with a Bar Raiser. Candidates are expected to show measurable results and personal ownership (use of "I", not just "we").',
    resumeTips: [
      'Lead bullets with the outcome and a metric (%, $, latency, users).',
      'Show personal ownership — what YOU decided and drove.',
      'Highlight scale, cost savings, and operational excellence.',
    ],
    values: [
      { name: 'Customer Obsession', description: 'Start with the customer and work backwards.', resumeSignals: ['customer-facing impact', 'NPS/CSAT gains', 'user-driven decisions'] },
      { name: 'Ownership', description: 'Act on behalf of the whole company; never say "that is not my job".', resumeSignals: ['end-to-end ownership', 'led X from design to production', 'on-call/incident ownership'] },
      { name: 'Invent and Simplify', description: 'Innovate and find ways to simplify.', resumeSignals: ['automation', 'new tooling', 'process simplification'] },
      { name: 'Are Right, A Lot', description: 'Strong judgment and good instincts, seek diverse perspectives.', resumeSignals: ['data-driven decisions', 'successful technical bets'] },
      { name: 'Learn and Be Curious', description: 'Never done learning.', resumeSignals: ['new technologies adopted', 'certifications', 'side projects'] },
      { name: 'Hire and Develop the Best', description: 'Raise the performance bar; coach others.', resumeSignals: ['mentoring', 'interviewing', 'onboarding'] },
      { name: 'Insist on the Highest Standards', description: 'Relentlessly high standards.', resumeSignals: ['quality metrics', 'test coverage', 'reduced defects'] },
      { name: 'Think Big', description: 'Create and communicate a bold direction.', resumeSignals: ['large-scale systems', 'org-wide initiatives'] },
      { name: 'Bias for Action', description: 'Speed matters; many decisions are reversible.', resumeSignals: ['rapid prototyping', 'shipped quickly', 'reduced cycle time'] },
      { name: 'Frugality', description: 'Accomplish more with less.', resumeSignals: ['cost reduction', 'resource optimization'] },
      { name: 'Earn Trust', description: 'Listen attentively, speak candidly, treat others respectfully.', resumeSignals: ['cross-team collaboration', 'stakeholder management'] },
      { name: 'Dive Deep', description: 'Operate at all levels; no task is beneath you.', resumeSignals: ['root-cause analysis', 'performance debugging'] },
      { name: 'Have Backbone; Disagree and Commit', description: 'Respectfully challenge decisions, then commit fully.', resumeSignals: ['pushed back with data', 'influenced architecture decisions'] },
      { name: 'Deliver Results', description: 'Focus on key inputs and deliver on time with quality.', resumeSignals: ['delivered under constraints', 'quantified outcomes'] },
      { name: "Strive to be Earth's Best Employer", description: 'Create a safer, more productive, more diverse and just work environment.', resumeSignals: ['team culture initiatives', 'inclusion efforts'] },
      { name: 'Success and Scale Bring Broad Responsibility', description: 'Consider second-order effects of our actions.', resumeSignals: ['security/privacy work', 'sustainability', 'community impact'] },
    ],
  },
  {
    slug: 'google',
    name: 'Google',
    category: 'big-tech',
    tagline: 'Strong fundamentals, scale, and collaborative problem solving.',
    hiringStyle:
      'Evaluates general cognitive ability, role-related knowledge, leadership, and "Googleyness". Heavy emphasis on algorithms/data structures, system design at scale, and structured problem solving.',
    resumeTips: [
      'Show scale (QPS, users, data volume) and technical depth.',
      'Highlight problem-solving, algorithms, and system design choices.',
      'Include open-source, research, or competitive programming where relevant.',
    ],
    values: [
      { name: 'General Cognitive Ability', description: 'How you solve ambiguous problems and learn quickly.', resumeSignals: ['novel solutions', 'algorithmic work', 'research'] },
      { name: 'Role-Related Knowledge', description: 'Depth in the relevant technical domain.', resumeSignals: ['relevant stack depth', 'system design', 'publications/patents'] },
      { name: 'Leadership (emergent)', description: 'Stepping up when needed and stepping back to let others lead.', resumeSignals: ['led projects without title', 'cross-functional influence'] },
      { name: 'Googleyness', description: 'Comfort with ambiguity, collaboration, intellectual humility, doing the right thing.', resumeSignals: ['collaboration', 'community involvement', 'bias to ethical choices'] },
      { name: 'Impact at Scale', description: 'Work that moves metrics for many users.', resumeSignals: ['scale metrics', 'performance gains', 'reliability improvements'] },
    ],
  },
  {
    slug: 'microsoft',
    name: 'Microsoft',
    category: 'big-tech',
    tagline: 'Growth mindset, customer focus, and inclusive collaboration.',
    hiringStyle:
      'Interviews probe technical skills plus growth mindset, collaboration, and customer impact. Candidates should show learning from failure and building on others\' work.',
    resumeTips: [
      'Show learning from setbacks and skill growth over time.',
      'Highlight cross-team collaboration and customer impact.',
      'Mention accessibility, inclusion, or enterprise-scale work if applicable.',
    ],
    values: [
      { name: 'Growth Mindset', description: 'Learn-it-all over know-it-all; curiosity and resilience.', resumeSignals: ['reskilling', 'certifications', 'pivoted tech stack'] },
      { name: 'Customer Obsession', description: 'Understand and meet customer needs.', resumeSignals: ['customer outcomes', 'feedback-driven features'] },
      { name: 'Diversity & Inclusion', description: 'Build products and teams that include everyone.', resumeSignals: ['accessibility work', 'inclusive team practices'] },
      { name: 'One Microsoft', description: 'Collaborate across boundaries.', resumeSignals: ['cross-org projects', 'shared platforms'] },
      { name: 'Making a Difference', description: 'Empower others and deliver meaningful impact.', resumeSignals: ['measurable impact', 'mentoring'] },
      { name: 'Respect, Integrity, Accountability', description: 'Core cultural values.', resumeSignals: ['ownership of outcomes', 'ethical decisions'] },
    ],
  },
  {
    slug: 'adobe',
    name: 'Adobe',
    category: 'product',
    tagline: 'Creativity and product craft at the heart of engineering.',
    hiringStyle:
      'Values craft, creativity, and collaboration between engineering, design, and product. Candidates who care about UX quality and shipping polished, user-loved products stand out.',
    resumeTips: [
      'Show product craft: UX polish, performance, attention to detail.',
      'Highlight design/engineering collaboration and creative tooling.',
      'Link portfolios, shipped products, or demos where possible.',
    ],
    values: [
      { name: 'Genuine', description: 'Authentic, honest, and respectful.', resumeSignals: ['transparent communication', 'team trust'] },
      { name: 'Exceptional', description: 'High bar for quality and craft.', resumeSignals: ['quality metrics', 'awards', 'polished shipped products'] },
      { name: 'Innovative', description: 'Push creative and technical boundaries.', resumeSignals: ['novel features', 'patents', 'prototypes'] },
      { name: 'Involved', description: 'Engaged with customers, community, and colleagues.', resumeSignals: ['community contributions', 'user research', 'mentoring'] },
      { name: 'Creativity & Product Craft', description: 'Care about how things look, feel, and perform for creators.', resumeSignals: ['UX improvements', 'performance of creative tools', 'design-system work'] },
    ],
  },
  {
    slug: 'product-based',
    name: 'Product-Based Companies (general)',
    category: 'product',
    tagline: 'Ownership, speed, and measurable product impact.',
    hiringStyle:
      'Emphasis on DSA/problem solving, system design, and product thinking. Candidates are judged on ownership, impact on product metrics, and ability to ship quickly with quality.',
    resumeTips: [
      'Tie technical work to product/business metrics.',
      'Show end-to-end ownership of features or services.',
      'Highlight scale, performance, and reliability work.',
    ],
    values: [
      { name: 'Ownership', description: 'Drive features end to end.', resumeSignals: ['led feature', 'owned service'] },
      { name: 'Product Thinking', description: 'Understand users and metrics.', resumeSignals: ['A/B tests', 'conversion/retention gains'] },
      { name: 'Technical Depth', description: 'Strong CS fundamentals and system design.', resumeSignals: ['architecture decisions', 'DSA/competitive programming'] },
      { name: 'Speed & Quality', description: 'Ship fast without breaking things.', resumeSignals: ['CI/CD', 'release cadence', 'test coverage'] },
      { name: 'Collaboration', description: 'Work with product and design.', resumeSignals: ['cross-functional delivery'] },
    ],
  },
  {
    slug: 'service-based',
    name: 'Service-Based Companies (general)',
    category: 'service',
    tagline: 'Client delivery, adaptability, and breadth of stack.',
    hiringStyle:
      'Screens for core fundamentals, adaptability across technologies, communication, and client-delivery readiness. Certifications, domain experience, and ability to work in project teams count heavily.',
    resumeTips: [
      'List technologies clearly and group by category.',
      'Show client-facing delivery, domain exposure, and project timelines.',
      'Include certifications and relevant training.',
    ],
    values: [
      { name: 'Client Delivery', description: 'Deliver on commitments to clients.', resumeSignals: ['on-time delivery', 'client satisfaction', 'SLAs'] },
      { name: 'Adaptability', description: 'Pick up new stacks and domains quickly.', resumeSignals: ['multiple stacks', 'cross-domain projects'] },
      { name: 'Communication', description: 'Clear written and verbal communication with stakeholders.', resumeSignals: ['client calls', 'documentation', 'presentations'] },
      { name: 'Process & Quality', description: 'Follow SDLC, Agile, and quality processes.', resumeSignals: ['Agile/Scrum', 'QA practices', 'code reviews'] },
      { name: 'Continuous Learning', description: 'Certifications and upskilling.', resumeSignals: ['certifications', 'training programs'] },
    ],
  },
];

async function seedCompanies() {
  await Promise.all(
    companies.map((c) =>
      CompanyRubric.updateOne({ slug: c.slug }, { $set: { ...c, sourceNote: DISCLAIMER } }, { upsert: true })
    )
  );
  console.log(`Seeded ${companies.length} company rubrics`);
}

module.exports = { seedCompanies };
