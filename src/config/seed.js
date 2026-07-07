// seedCategoriesAndProfiles.js
//
// WHY THIS FILE EXISTS (issues #2 and #3 from your message):
//
// Checked your dummy data against CategoryPage.jsx's query logic. The
// categories.json you shared has NO `_id` field on any document — Mongo
// will auto-generate a fresh, random _id for each one on insert. But
// every profile in profiles.json already has a hardcoded `category` id
// (e.g. Rohan Deshmukh -> "0d96d68f94b3cb628093d318") that was made up
// independently and does NOT match any id Mongo will actually generate
// when you insert those categories.
//
// CategoryPage.jsx always sends `category: category._id` (the REAL id
// it got back from GET /categories) as a filter alongside `q`. Since no
// profile's `category` field equals any real category id, that filter
// matches zero documents — every single time, category page or
// subcategory page, doesn't matter. That's the "subcategory profiles
// not visible" bug. It isn't really a subcategory-specific bug; it
// would break "Browse all experts in {category}" too, since that path
// also filters by category._id.
//
// THE FIX: seed categories with FIXED, known ids, then seed profiles
// using those SAME ids in their `category` field — so a real, inserted
// category document's _id is what every profile actually references.
//
// This script inserts both collections in the right order so that's
// guaranteed, instead of leaving it to two separate scripts that could
// drift out of sync again.
//
// Usage:
//   node seedCategoriesAndProfiles.js
// Adjust MONGO_URI env var name and the two model require() paths below
// if they differ in your project.

const mongoose = require('mongoose');
require('dotenv').config();

// ⚠️ Adjust these two paths if your models live elsewhere.
const Category = require('../models/categories/category.model');
const Profile = require('../models/profiles/profile.model');

const oid = (hex) => new mongoose.Types.ObjectId(hex);

// ── Fixed category ids — profiles.category below reference these directly ──
const CATEGORY_IDS = {
  softwareIT:   '009655774029a35690d4d146',
  design:       '9f08f984bd0ae21994eb7fd2',
  marketing:    '4a5f0eccf653f08232f45e01',
  writing:      '6c6c52a6aa458fcb2ed1fe37',
  business:     '938812cb72f862f67a7e2bec',
  legal:        'b8607d39ade6b691c11c4e77',
  salesSupport: '698110b0c72dea659e36134a',
  engineering:  'eec7a3f9238ff3630136630c',
  homeServices: '6b9f85364bbab2eb7fd149f8',
  beauty:       'cfb80a25dadd82611538899c',
  education:    '3bccdd7325894b60b033b3b4',
  healthcare:   '23c62934e6d5a4a82f3c147b',
  construction: '1a7eb15604869101f3a96838',
  automotive:   '093d3785aa9096ac2907248e',
  events:       'b386596b4ad454adbe2870d6',
  manufacturing:'75d6985f34e21a835f77fd8f',
  logistics:    '48f11221b85ee0be5c457841',
  domestic:     '344dcab5d1b914f4165f3ead',
  agriculture:  '374dece0524aef22edd72b2d',
  security:     '3444175b097bfbd618dad19d',
  media:        '545ad9e752af24af81faa79d',
  misc:         'd8f397ec9ed28832e643b501',
};

// ── Categories — same taxonomy you shared, now with fixed _ids ─────────────
const categories = [
  { _id: oid(CATEGORY_IDS.softwareIT), name: 'Software & IT', slug: 'software-it', description: 'Full-stack development, mobile apps, cloud, DevOps, AI/ML and more.', icon: '💻', isFeatured: true, order: 0, isActive: true, skills: ['Full Stack Developer','Frontend Developer','Backend Developer','Mobile App Developer (Android/iOS)','Flutter Developer','React Native Developer','WordPress Developer','Shopify Developer','Laravel Developer','PHP Developer','Python Developer','Java Developer','C#/.NET Developer','Node.js Developer','React.js Developer','Angular Developer','Vue.js Developer','AI Developer','Machine Learning Engineer','Data Scientist','DevOps Engineer','Cloud Engineer','Cyber Security Expert','Blockchain Developer','QA Tester','Database Administrator','ERP Developer','API Developer'] },
  { _id: oid(CATEGORY_IDS.design), name: 'Design & Creative', slug: 'design-creative', description: 'Graphic, UI/UX, brand, motion and product design.', icon: '🎨', isFeatured: true, order: 1, isActive: true, skills: ['Graphic Designer','UI Designer','UX Designer','Logo Designer','Brand Identity Designer','Illustrator','Motion Graphics Designer','Video Editor','Animator','3D Artist','Interior Designer','Fashion Designer','Product Designer','Packaging Designer','NFT Artist'] },
  { _id: oid(CATEGORY_IDS.marketing), name: 'Digital Marketing', slug: 'digital-marketing', description: 'SEO, paid ads, social media and content marketing.', icon: '📈', isFeatured: true, order: 2, isActive: true, skills: ['SEO Expert','SEM Expert','Google Ads Specialist','Facebook Ads Expert','Instagram Marketing','LinkedIn Marketing','YouTube Marketing','Email Marketing','Affiliate Marketer','Content Marketer','Influencer Marketing','Marketing Consultant'] },
  { _id: oid(CATEGORY_IDS.writing), name: 'Writing & Translation', slug: 'writing-translation', description: 'Content, copywriting, technical writing and translation.', icon: '✍️', isFeatured: false, order: 3, isActive: true, skills: ['Content Writer','Copywriter','Technical Writer','Ghost Writer','Resume Writer','Blog Writer','Script Writer','Translator','Proofreader','Editor'] },
  { _id: oid(CATEGORY_IDS.business), name: 'Business & Finance', slug: 'business-finance', description: 'Accounting, tax, financial advisory and business consulting.', icon: '💰', isFeatured: false, order: 4, isActive: true, skills: ['Accountant','Chartered Accountant','Bookkeeper','Tax Consultant','Financial Advisor','Business Consultant','Virtual CFO','Data Analyst','Business Analyst'] },
  { _id: oid(CATEGORY_IDS.legal), name: 'Legal', slug: 'legal', description: 'Legal advisory, contracts, trademarks and compliance.', icon: '⚖️', isFeatured: false, order: 5, isActive: true, skills: ['Lawyer','Legal Advisor','Contract Drafting','Trademark Expert','Patent Consultant','Company Registration Consultant'] },
  { _id: oid(CATEGORY_IDS.salesSupport), name: 'Sales & Customer Support', slug: 'sales-customer-support', description: 'Telesales, business development and customer support.', icon: '📞', isFeatured: false, order: 6, isActive: true, skills: ['Telecaller','Sales Executive','Business Development Executive','Customer Support Executive','Chat Support Agent','Call Center Representative'] },
  { _id: oid(CATEGORY_IDS.engineering), name: 'Engineering', slug: 'engineering', description: 'Civil, mechanical, electrical and structural engineering.', icon: '🛠️', isFeatured: false, order: 7, isActive: true, skills: ['Civil Engineer','Mechanical Engineer','Electrical Engineer','Electronics Engineer','Structural Engineer','AutoCAD Designer','Architect'] },
  { _id: oid(CATEGORY_IDS.homeServices), name: 'Home Services', slug: 'home-services', description: 'Electricians, plumbers, technicians and repair experts.', icon: '🏠', isFeatured: true, order: 8, isActive: true, skills: ['Electrician','Plumber','Carpenter','Painter','Mason','AC Technician','Refrigerator Technician','CCTV Installer','RO Technician','Appliance Repair'] },
  { _id: oid(CATEGORY_IDS.beauty), name: 'Beauty & Wellness', slug: 'beauty-wellness', description: 'Makeup, hair, spa, fitness and nutrition experts.', icon: '💆', isFeatured: true, order: 9, isActive: true, skills: ['Makeup Artist','Hair Stylist','Beautician','Nail Artist','Spa Therapist','Massage Therapist','Yoga Trainer','Fitness Trainer','Personal Trainer','Nutritionist'] },
  { _id: oid(CATEGORY_IDS.education), name: 'Education', slug: 'education', description: 'Tutors, teachers and skill trainers, online or offline.', icon: '📚', isFeatured: false, order: 10, isActive: true, skills: ['Tutor','Teacher','Online Tutor','Spoken English Trainer','Coding Instructor','Music Teacher','Dance Teacher','Language Teacher'] },
  { _id: oid(CATEGORY_IDS.healthcare), name: 'Healthcare', slug: 'healthcare', description: 'Doctors, nurses, therapists and medical consultants.', icon: '🩺', isFeatured: true, order: 11, isActive: true, skills: ['Doctor','Dentist','Physiotherapist','Nurse','Pharmacist','Lab Technician','Caregiver','Medical Consultant'] },
  { _id: oid(CATEGORY_IDS.construction), name: 'Construction', slug: 'construction', description: 'Contractors, builders and site supervision.', icon: '🏗️', isFeatured: false, order: 12, isActive: true, skills: ['Contractor','Builder','Site Supervisor','Quantity Surveyor','Surveyor','Building Consultant'] },
  { _id: oid(CATEGORY_IDS.automotive), name: 'Automotive', slug: 'automotive', description: 'Mechanics, auto electricians and drivers.', icon: '🚗', isFeatured: false, order: 13, isActive: true, skills: ['Car Mechanic','Bike Mechanic','Auto Electrician','Car Detailer','Driver'] },
  { _id: oid(CATEGORY_IDS.events), name: 'Event Services', slug: 'event-services', description: 'Photography, planning and decor for every occasion.', icon: '🎉', isFeatured: false, order: 14, isActive: true, skills: ['Photographer','Videographer','DJ','Anchor','Event Planner','Wedding Planner','Decorator'] },
  { _id: oid(CATEGORY_IDS.manufacturing), name: 'Manufacturing', slug: 'manufacturing', description: 'Welding, fabrication and production operations.', icon: '🏭', isFeatured: false, order: 15, isActive: true, skills: ['Welder','Fabricator','Machine Operator','CNC Programmer','Production Supervisor'] },
  { _id: oid(CATEGORY_IDS.logistics), name: 'Logistics', slug: 'logistics', description: 'Delivery, courier, transport and warehousing.', icon: '🚚', isFeatured: false, order: 16, isActive: true, skills: ['Delivery Partner','Courier Service','Transport Contractor','Warehouse Staff','Forklift Operator'] },
  { _id: oid(CATEGORY_IDS.domestic), name: 'Domestic Services', slug: 'domestic-services', description: 'Housekeeping, cooking, childcare and elder care.', icon: '🧹', isFeatured: false, order: 17, isActive: true, skills: ['Maid','Housekeeper','Cook','Babysitter','Elder Care','Pet Care'] },
  { _id: oid(CATEGORY_IDS.agriculture), name: 'Agriculture', slug: 'agriculture', description: 'Farming, dairy, poultry and irrigation expertise.', icon: '🌾', isFeatured: false, order: 18, isActive: true, skills: ['Farmer','Tractor Operator','Dairy Expert','Poultry Expert','Irrigation Technician'] },
  { _id: oid(CATEGORY_IDS.security), name: 'Security', slug: 'security', description: 'Security guards, CCTV operators and fire safety.', icon: '🛡️', isFeatured: false, order: 19, isActive: true, skills: ['Security Guard','Bouncer','CCTV Operator','Fire Safety Officer'] },
  { _id: oid(CATEGORY_IDS.media), name: 'Media & Entertainment', slug: 'media-entertainment', description: 'Singers, producers, actors and on-screen talent.', icon: '🎬', isFeatured: false, order: 20, isActive: true, skills: ['Singer','Music Producer','Voice Over Artist','Actor','Model','Influencer'] },
  { _id: oid(CATEGORY_IDS.misc), name: 'Miscellaneous', slug: 'miscellaneous', description: 'Virtual assistants, admin, HR and real estate roles.', icon: '🧩', isFeatured: false, order: 21, isActive: true, skills: ['Virtual Assistant','Data Entry Operator','Project Manager','Procurement Specialist','Recruiter (HR)','Translator','Travel Agent','Insurance Advisor','Real Estate Agent'] },
];

// ── Profiles — your 10 sample profiles, category field corrected to
// point at the matching category above (was previously a made-up id
// that matched nothing) ────────────────────────────────────────────────
const profiles = [
  {
    _id: oid('518c3864757132792a21e536'), user: oid('89b2f9e335113f81e082eee6'),
    fullName: 'Rohan Deshmukh', age: 27, gender: 'male',
    bio: 'Full Stack Developer with 4+ years building MERN stack applications, REST APIs and scalable backend systems.',
    profileImage: { url: 'https://res.cloudinary.com/demo/image/upload/v1/profiles/rohan.jpg', publicId: 'profiles/rohan' },
    category: oid(CATEGORY_IDS.softwareIT), // ✅ was a made-up id — now Software & IT for real
    skills: [{ name: 'React.js', level: 'expert' }, { name: 'Node.js', level: 'expert' }, { name: 'MongoDB', level: 'intermediate' }, { name: 'Express.js', level: 'expert' }, { name: 'Redux Toolkit', level: 'intermediate' }],
    experience: [{ title: 'Software Engineer', company: 'TechNova Solutions', startDate: new Date('2022-06-01'), endDate: null, isCurrent: true, description: 'Leading frontend and backend development for SaaS products.' }],
    education: [{ degree: 'B.Tech Computer Engineering', institution: 'Mumbai University', year: 2021 }],
    languages: [{ name: 'English', proficiency: 'fluent' }, { name: 'Hindi', proficiency: 'native' }, { name: 'Marathi', proficiency: 'native' }],
    certifications: [{ name: 'AWS Certified Developer', issuer: 'Amazon Web Services', year: 2023, url: '' }],
    portfolio: [{ title: 'E-commerce Platform', description: 'MERN stack multi-vendor store', url: 'https://github.com/rohan/ecommerce', image: { url: '', publicId: '' } }],
    resume: { url: 'https://res.cloudinary.com/demo/raw/upload/v1/resumes/rohan.pdf', publicId: 'resumes/rohan', updatedAt: new Date('2026-06-28T11:40:10.000Z') },
    workType: 'remote', jobType: 'fulltime', availability: 'immediate',
    expectedSalary: { min: 60000, max: 90000, currency: 'INR' }, hourlyRate: { amount: 700, currency: 'INR' },
    location: { country: 'India', state: 'Maharashtra', city: 'Mumbai', coordinates: { type: 'Point', coordinates: [72.8777, 19.0760] } },
    social: { linkedin: 'https://linkedin.com/in/rohandeshmukh', github: 'https://github.com/rohan', website: '' },
    contact: { email: 'rohan.deshmukh@example.com', phone: '9876543210' },
    isVisible: true, isFeatured: true, isVerified: true, approvalStatus: 'approved',
    submittedForApprovalAt: new Date('2026-05-13T09:00:00.000Z'), approvalDecisionAt: new Date('2026-05-14T10:30:00.000Z'), rejectionReason: null,
    totalViews: 342, averageRating: 4.7, totalReviews: 18, completionPercentage: 95, totalExperience: 4,
    createdAt: new Date('2026-05-12T09:15:22.000Z'), updatedAt: new Date('2026-06-28T11:40:10.000Z'), __v: 3,
  },
  {
    _id: oid('295a14d4468bf19f735ae585'), user: oid('8b0cf3e989b2d1f8bff55029'),
    fullName: 'Ananya Kulkarni', age: 25, gender: 'female',
    bio: 'UI/UX Designer passionate about creating clean, user-centric interfaces and design systems.',
    profileImage: { url: '', publicId: '' },
    category: oid(CATEGORY_IDS.design), // ✅ Design & Creative
    skills: [{ name: 'Figma', level: 'expert' }, { name: 'Adobe XD', level: 'intermediate' }, { name: 'Wireframing', level: 'expert' }, { name: 'Design Systems', level: 'intermediate' }],
    experience: [{ title: 'UI/UX Designer', company: 'Creative Pixel Studio', startDate: new Date('2023-01-15'), endDate: null, isCurrent: true, description: 'Designing mobile and web interfaces for client products.' }],
    education: [{ degree: 'B.Des Communication Design', institution: 'Symbiosis Institute of Design', year: 2022 }],
    languages: [{ name: 'English', proficiency: 'fluent' }, { name: 'Marathi', proficiency: 'native' }],
    certifications: [{ name: 'Google UX Design Certificate', issuer: 'Coursera', year: 2022, url: '' }],
    portfolio: [{ title: 'Fintech App Redesign', description: 'Complete UX overhaul for a banking app', url: 'https://behance.net/ananya/fintech', image: { url: '', publicId: '' } }],
    resume: { url: '', publicId: '', updatedAt: null },
    workType: 'hybrid', jobType: 'parttime', availability: 'one_week',
    expectedSalary: { min: 45000, max: 70000, currency: 'INR' }, hourlyRate: { amount: 550, currency: 'INR' },
    location: { country: 'India', state: 'Maharashtra', city: 'Pune', coordinates: { type: 'Point', coordinates: [73.8567, 18.5204] } },
    social: { linkedin: 'https://linkedin.com/in/ananyak', github: '', website: 'https://ananyak.design' },
    contact: { email: 'ananya.kulkarni@example.com', phone: '9823456712' },
    isVisible: true, isFeatured: false, isVerified: true, approvalStatus: 'approved',
    submittedForApprovalAt: new Date('2026-04-21T10:00:00.000Z'), approvalDecisionAt: new Date('2026-04-22T12:00:00.000Z'), rejectionReason: null,
    totalViews: 210, averageRating: 4.5, totalReviews: 12, completionPercentage: 88, totalExperience: 3,
    createdAt: new Date('2026-04-20T14:05:00.000Z'), updatedAt: new Date('2026-06-25T08:22:31.000Z'), __v: 2,
  },
  {
    _id: oid('9125420c2f6b127d0ba12d16'), user: oid('88d7d0020fcd262ac7e98367'),
    fullName: 'Suresh Nair', age: 31, gender: 'male',
    bio: 'SEO Expert helping brands rank higher with data-driven on-page and off-page optimization strategies.',
    profileImage: { url: '', publicId: '' },
    category: oid(CATEGORY_IDS.marketing), // ✅ Digital Marketing
    skills: [{ name: 'SEO', level: 'expert' }, { name: 'Google Analytics', level: 'expert' }, { name: 'Keyword Research', level: 'intermediate' }, { name: 'Link Building', level: 'intermediate' }],
    experience: [{ title: 'SEO Consultant', company: 'Freelance', startDate: new Date('2021-03-01'), endDate: null, isCurrent: true, description: 'Managing SEO campaigns for 15+ clients across industries.' }],
    education: [{ degree: 'BBA Marketing', institution: 'Mumbai University', year: 2016 }],
    languages: [{ name: 'English', proficiency: 'fluent' }, { name: 'Hindi', proficiency: 'native' }],
    certifications: [{ name: 'Google Analytics Certified', issuer: 'Google', year: 2023, url: '' }],
    portfolio: [],
    resume: { url: '', publicId: '', updatedAt: null },
    workType: 'remote', jobType: 'freelance', availability: 'immediate',
    expectedSalary: { min: 35000, max: 55000, currency: 'INR' }, hourlyRate: { amount: 400, currency: 'INR' },
    location: { country: 'India', state: 'Maharashtra', city: 'Thane', coordinates: { type: 'Point', coordinates: [72.9781, 19.2183] } },
    social: { linkedin: 'https://linkedin.com/in/sureshnair', github: '', website: '' },
    contact: { email: 'suresh.nair@example.com', phone: '9812345678' },
    isVisible: true, isFeatured: false, isVerified: false, approvalStatus: 'pending',
    submittedForApprovalAt: new Date('2026-06-19T09:00:00.000Z'), approvalDecisionAt: null, rejectionReason: null,
    totalViews: 156, averageRating: 4.2, totalReviews: 9, completionPercentage: 76, totalExperience: 5,
    createdAt: new Date('2026-03-11T10:00:00.000Z'), updatedAt: new Date('2026-06-20T16:12:45.000Z'), __v: 1,
  },
  {
    _id: oid('12c93d61e6af40c822b29b58'), user: oid('58e1d664875c19341c508d5f'),
    fullName: 'Priya Sharma', age: 29, gender: 'female',
    bio: 'Content Writer and Editor specializing in SaaS, technology and lifestyle blogs with strong SEO knowledge.',
    profileImage: { url: 'https://res.cloudinary.com/demo/image/upload/v1/profiles/priya.jpg', publicId: 'profiles/priya' },
    category: oid(CATEGORY_IDS.writing), // ✅ Writing & Translation
    skills: [{ name: 'Content Writing', level: 'expert' }, { name: 'Copywriting', level: 'expert' }, { name: 'SEO Writing', level: 'intermediate' }, { name: 'Editing', level: 'expert' }],
    experience: [{ title: 'Senior Content Writer', company: 'WordCraft Media', startDate: new Date('2020-07-01'), endDate: new Date('2024-12-31'), isCurrent: false, description: 'Wrote and edited 500+ articles for tech and lifestyle clients.' }],
    education: [{ degree: 'BA English Literature', institution: 'Delhi University', year: 2018 }],
    languages: [{ name: 'English', proficiency: 'fluent' }, { name: 'Hindi', proficiency: 'native' }],
    certifications: [],
    portfolio: [{ title: 'SaaS Blog Portfolio', description: 'Collection of published SaaS and tech articles', url: 'https://priyawrites.com', image: { url: '', publicId: '' } }],
    resume: { url: 'https://res.cloudinary.com/demo/raw/upload/v1/resumes/priya.pdf', publicId: 'resumes/priya', updatedAt: new Date('2026-06-30T09:00:00.000Z') },
    workType: 'remote', jobType: 'freelance', availability: 'one_week',
    expectedSalary: { min: 30000, max: 48000, currency: 'INR' }, hourlyRate: { amount: 350, currency: 'INR' },
    location: { country: 'India', state: 'Delhi', city: 'Delhi', coordinates: { type: 'Point', coordinates: [77.2090, 28.6139] } },
    social: { linkedin: 'https://linkedin.com/in/priyasharma', github: '', website: 'https://priyawrites.com' },
    contact: { email: 'priya.sharma@example.com', phone: '9765432190' },
    isVisible: true, isFeatured: true, isVerified: true, approvalStatus: 'approved',
    submittedForApprovalAt: new Date('2026-02-19T08:00:00.000Z'), approvalDecisionAt: new Date('2026-02-20T09:00:00.000Z'), rejectionReason: null,
    totalViews: 289, averageRating: 4.8, totalReviews: 22, completionPercentage: 92, totalExperience: 6,
    createdAt: new Date('2026-02-18T07:30:00.000Z'), updatedAt: new Date('2026-06-30T09:05:00.000Z'), __v: 5,
  },
  {
    _id: oid('9b4ef5fccfe6aed182c6422f'), user: oid('300d7bb8743ca0de78c8b457'),
    fullName: 'Vikram Joshi', age: 35, gender: 'male',
    bio: 'Business Consultant with expertise in startup strategy, financial planning and process optimization.',
    profileImage: { url: '', publicId: '' },
    category: oid(CATEGORY_IDS.business), // ✅ Business & Finance
    skills: [{ name: 'Business Strategy', level: 'expert' }, { name: 'Financial Modeling', level: 'expert' }, { name: 'Market Research', level: 'intermediate' }],
    experience: [{ title: 'Senior Business Consultant', company: 'Apex Consulting Group', startDate: new Date('2016-04-01'), endDate: null, isCurrent: true, description: 'Advising SMEs and startups on growth strategy and operations.' }],
    education: [{ degree: 'MBA Finance', institution: 'NMIMS Mumbai', year: 2015 }],
    languages: [{ name: 'English', proficiency: 'fluent' }, { name: 'Hindi', proficiency: 'native' }, { name: 'Marathi', proficiency: 'conversational' }],
    certifications: [{ name: 'PMP Certified', issuer: 'PMI', year: 2019, url: '' }],
    portfolio: [],
    resume: { url: '', publicId: '', updatedAt: null },
    workType: 'onsite', jobType: 'fulltime', availability: 'not_available',
    expectedSalary: { min: 80000, max: 120000, currency: 'INR' }, hourlyRate: { amount: 1000, currency: 'INR' },
    location: { country: 'India', state: 'Maharashtra', city: 'Bhayandar', coordinates: { type: 'Point', coordinates: [72.8500, 19.3019] } },
    social: { linkedin: 'https://linkedin.com/in/vikramjoshi', github: '', website: '' },
    contact: { email: 'vikram.joshi@example.com', phone: '9898765432' },
    isVisible: true, isFeatured: false, isVerified: true, approvalStatus: 'approved',
    submittedForApprovalAt: new Date('2026-01-06T08:00:00.000Z'), approvalDecisionAt: new Date('2026-01-07T09:00:00.000Z'), rejectionReason: null,
    totalViews: 178, averageRating: 4.6, totalReviews: 14, completionPercentage: 100, totalExperience: 10,
    createdAt: new Date('2026-01-05T12:00:00.000Z'), updatedAt: new Date('2026-06-15T18:44:00.000Z'), __v: 4,
  },
  {
    _id: oid('f58dfcd02e68e23376f47320'), user: oid('2bc2f99efff70b5617601648'),
    fullName: 'Sandeep Yadav', age: 33, gender: 'male',
    bio: 'Licensed Electrician offering residential and commercial wiring, repair and installation services.',
    profileImage: { url: '', publicId: '' },
    category: oid(CATEGORY_IDS.homeServices), // ✅ Home Services
    skills: [{ name: 'Electrical Wiring', level: 'expert' }, { name: 'Circuit Repair', level: 'expert' }, { name: 'Panel Installation', level: 'intermediate' }],
    experience: [{ title: 'Electrician', company: 'Self Employed', startDate: new Date('2018-01-01'), endDate: null, isCurrent: true, description: 'Providing electrical repair and installation services across the region.' }],
    education: [{ degree: 'ITI Electrician', institution: 'Government ITI Thane', year: 2014 }],
    languages: [{ name: 'Hindi', proficiency: 'native' }, { name: 'Marathi', proficiency: 'fluent' }],
    certifications: [{ name: 'Electrical Safety Certification', issuer: 'State Skill Board', year: 2018, url: '' }],
    portfolio: [],
    resume: { url: '', publicId: '', updatedAt: null },
    workType: 'onsite', jobType: 'freelance', availability: 'immediate',
    expectedSalary: { min: 20000, max: 35000, currency: 'INR' }, hourlyRate: { amount: 220, currency: 'INR' },
    location: { country: 'India', state: 'Maharashtra', city: 'Mira Road', coordinates: { type: 'Point', coordinates: [72.8722, 19.2952] } },
    social: { linkedin: '', github: '', website: '' },
    contact: { email: 'sandeep.yadav@example.com', phone: '9723456781' },
    isVisible: true, isFeatured: false, isVerified: true, approvalStatus: 'approved',
    submittedForApprovalAt: new Date('2026-03-03T07:00:00.000Z'), approvalDecisionAt: new Date('2026-03-04T08:00:00.000Z'), rejectionReason: null,
    totalViews: 98, averageRating: 4.4, totalReviews: 27, completionPercentage: 80, totalExperience: 8,
    createdAt: new Date('2026-03-02T06:45:00.000Z'), updatedAt: new Date('2026-06-22T10:10:00.000Z'), __v: 2,
  },
  {
    _id: oid('76274edb39f589b7e46b43ab'), user: oid('f1880bb5e320f147561382ac'),
    fullName: 'Meera Iyer', age: 28, gender: 'female',
    bio: 'Certified Yoga Trainer and Wellness Coach guiding clients through personalized fitness and mindfulness programs.',
    profileImage: { url: 'https://res.cloudinary.com/demo/image/upload/v1/profiles/meera.jpg', publicId: 'profiles/meera' },
    category: oid(CATEGORY_IDS.beauty), // ✅ Beauty & Wellness
    skills: [{ name: 'Hatha Yoga', level: 'expert' }, { name: 'Vinyasa Flow', level: 'expert' }, { name: 'Meditation', level: 'intermediate' }],
    experience: [{ title: 'Lead Yoga Instructor', company: 'Zenith Wellness Studio', startDate: new Date('2019-09-01'), endDate: null, isCurrent: true, description: 'Conducting group and private yoga sessions, online and offline.' }],
    education: [{ degree: 'Diploma in Yoga Science', institution: 'S-VYASA University', year: 2017 }],
    languages: [{ name: 'English', proficiency: 'fluent' }, { name: 'Kannada', proficiency: 'native' }, { name: 'Hindi', proficiency: 'conversational' }],
    certifications: [{ name: 'RYT 500 Yoga Certification', issuer: 'Yoga Alliance', year: 2020, url: '' }],
    portfolio: [],
    resume: { url: '', publicId: '', updatedAt: null },
    workType: 'hybrid', jobType: 'parttime', availability: 'one_week',
    expectedSalary: { min: 25000, max: 40000, currency: 'INR' }, hourlyRate: { amount: 400, currency: 'INR' },
    location: { country: 'India', state: 'Karnataka', city: 'Bengaluru', coordinates: { type: 'Point', coordinates: [77.5946, 12.9716] } },
    social: { linkedin: '', github: '', website: 'https://meerayoga.com' },
    contact: { email: 'meera.iyer@example.com', phone: '9645123789' },
    isVisible: true, isFeatured: true, isVerified: true, approvalStatus: 'approved',
    submittedForApprovalAt: new Date('2026-03-01T06:00:00.000Z'), approvalDecisionAt: new Date('2026-03-02T07:00:00.000Z'), rejectionReason: null,
    totalViews: 265, averageRating: 4.9, totalReviews: 31, completionPercentage: 97, totalExperience: 7,
    createdAt: new Date('2026-02-28T05:20:00.000Z'), updatedAt: new Date('2026-06-29T13:33:00.000Z'), __v: 3,
  },
  {
    _id: oid('795bb547cf43fab3ebe1aea3'), user: oid('50dc0df4cb6d0a3e1d6ac5c0'),
    fullName: 'Arjun Verma', age: 24, gender: 'male',
    bio: 'Online Tutor specializing in Mathematics and Physics for high school and competitive exam students.',
    profileImage: { url: '', publicId: '' },
    category: oid(CATEGORY_IDS.education), // ✅ Education
    skills: [{ name: 'Mathematics', level: 'expert' }, { name: 'Physics', level: 'expert' }, { name: 'JEE Preparation', level: 'intermediate' }],
    experience: [{ title: 'Online Tutor', company: 'Freelance', startDate: new Date('2024-01-01'), endDate: null, isCurrent: true, description: 'Teaching Math and Physics to students preparing for competitive exams.' }],
    education: [{ degree: 'B.Sc Physics', institution: 'RTM Nagpur University', year: 2023 }],
    languages: [{ name: 'English', proficiency: 'fluent' }, { name: 'Hindi', proficiency: 'native' }, { name: 'Marathi', proficiency: 'native' }],
    certifications: [],
    portfolio: [],
    resume: { url: '', publicId: '', updatedAt: null },
    workType: 'remote', jobType: 'parttime', availability: 'immediate',
    expectedSalary: { min: 20000, max: 32000, currency: 'INR' }, hourlyRate: { amount: 300, currency: 'INR' },
    location: { country: 'India', state: 'Maharashtra', city: 'Nagpur', coordinates: { type: 'Point', coordinates: [79.0882, 21.1458] } },
    social: { linkedin: 'https://linkedin.com/in/arjunverma', github: '', website: '' },
    contact: { email: 'arjun.verma@example.com', phone: '9534512367' },
    isVisible: true, isFeatured: false, isVerified: false, approvalStatus: 'draft',
    submittedForApprovalAt: null, approvalDecisionAt: null, rejectionReason: null,
    totalViews: 132, averageRating: 4.3, totalReviews: 16, completionPercentage: 70, totalExperience: 2,
    createdAt: new Date('2026-05-01T11:11:00.000Z'), updatedAt: new Date('2026-06-27T15:00:00.000Z'), __v: 1,
  },
  {
    _id: oid('db7bfab5d8ea3e57c90cc31f'), user: oid('8ecb7dc71e001750695078f0'),
    fullName: 'Kavita Rao', age: 30, gender: 'female',
    bio: 'Professional Photographer and Videographer specializing in weddings, events and brand photoshoots.',
    profileImage: { url: 'https://res.cloudinary.com/demo/image/upload/v1/profiles/kavita.jpg', publicId: 'profiles/kavita' },
    category: oid(CATEGORY_IDS.events), // ✅ Event Services
    skills: [{ name: 'Wedding Photography', level: 'expert' }, { name: 'Event Photography', level: 'expert' }, { name: 'Video Editing', level: 'intermediate' }, { name: 'Lightroom', level: 'expert' }],
    experience: [{ title: 'Founder & Lead Photographer', company: 'Kavita Rao Photography', startDate: new Date('2017-05-01'), endDate: null, isCurrent: true, description: 'Running an independent photography and videography studio.' }],
    education: [{ degree: 'Diploma in Photography', institution: 'National Institute of Photography', year: 2016 }],
    languages: [{ name: 'English', proficiency: 'fluent' }, { name: 'Gujarati', proficiency: 'native' }, { name: 'Hindi', proficiency: 'fluent' }],
    certifications: [],
    portfolio: [{ title: 'Wedding Portfolio 2025', description: 'Highlights from 20+ weddings shot in 2025', url: 'https://kavitarao.com/weddings', image: { url: '', publicId: '' } }],
    resume: { url: '', publicId: '', updatedAt: null },
    workType: 'onsite', jobType: 'freelance', availability: 'one_month',
    expectedSalary: { min: 40000, max: 65000, currency: 'INR' }, hourlyRate: { amount: 1500, currency: 'INR' },
    location: { country: 'India', state: 'Gujarat', city: 'Ahmedabad', coordinates: { type: 'Point', coordinates: [72.5714, 23.0225] } },
    social: { linkedin: '', github: '', website: 'https://kavitarao.com' },
    contact: { email: 'kavita.rao@example.com', phone: '9412378965' },
    isVisible: true, isFeatured: true, isVerified: true, approvalStatus: 'approved',
    submittedForApprovalAt: new Date('2026-01-21T07:00:00.000Z'), approvalDecisionAt: new Date('2026-01-22T08:00:00.000Z'), rejectionReason: null,
    totalViews: 401, averageRating: 4.9, totalReviews: 45, completionPercentage: 100, totalExperience: 9,
    createdAt: new Date('2026-01-20T08:00:00.000Z'), updatedAt: new Date('2026-06-26T19:20:00.000Z'), __v: 6,
  },
  {
    _id: oid('d20b36ca2591dfaa096f9309'), user: oid('b077aaa6045f0b34043fb1c2'),
    fullName: 'Neha Pillai', age: 26, gender: 'female',
    bio: 'Virtual Assistant providing administrative support, data entry, calendar management and email handling for busy professionals.',
    profileImage: { url: '', publicId: '' },
    category: oid(CATEGORY_IDS.misc), // ✅ Miscellaneous
    skills: [{ name: 'Data Entry', level: 'expert' }, { name: 'Calendar Management', level: 'intermediate' }, { name: 'Email Handling', level: 'expert' }, { name: 'MS Office', level: 'intermediate' }],
    experience: [{ title: 'Virtual Assistant', company: 'Freelance', startDate: new Date('2023-02-01'), endDate: null, isCurrent: true, description: 'Supporting small business owners with day-to-day administrative tasks.' }],
    education: [{ degree: 'BCom', institution: 'Mahatma Gandhi University', year: 2021 }],
    languages: [{ name: 'English', proficiency: 'fluent' }, { name: 'Malayalam', proficiency: 'native' }],
    certifications: [],
    portfolio: [],
    resume: { url: '', publicId: '', updatedAt: null },
    workType: 'remote', jobType: 'parttime', availability: 'immediate',
    expectedSalary: { min: 18000, max: 28000, currency: 'INR' }, hourlyRate: { amount: 200, currency: 'INR' },
    location: { country: 'India', state: 'Kerala', city: 'Kochi', coordinates: { type: 'Point', coordinates: [76.2673, 9.9312] } },
    social: { linkedin: 'https://linkedin.com/in/nehapillai', github: '', website: '' },
    contact: { email: 'neha.pillai@example.com', phone: '9367841250' },
    isVisible: true, isFeatured: false, isVerified: false, approvalStatus: 'pending',
    submittedForApprovalAt: new Date('2026-06-19T10:00:00.000Z'), approvalDecisionAt: null, rejectionReason: null,
    totalViews: 87, averageRating: 4.1, totalReviews: 7, completionPercentage: 65, totalExperience: 3,
    createdAt: new Date('2026-04-08T09:50:00.000Z'), updatedAt: new Date('2026-06-18T12:15:00.000Z'), __v: 1,
  },
];

async function seed() {
  const uri = "mongodb://localhost:27017/hire-me";
  if (!uri) {
    console.error('Set MONGO_URI (or MONGODB_URI) in your .env before running this script.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  // Delete by NAME, not _id — your DB already has categories with these
  // same names from the earlier (mismatched) seed, sitting under
  // different, randomly auto-generated _ids. Deleting by _id wouldn't
  // touch those old rows, so insertMany collided with the unique `name`
  // index. This clears the old ones out first so the fixed-id versions
  // can go in cleanly.
  await Category.deleteMany({ name: { $in: categories.map((c) => c.name) } });
  await Category.insertMany(categories);
  console.log(`Inserted ${categories.length} categories.`);

  // Same idea for profiles, keyed by fullName in case old dummy rows
  // exist under different _ids too.
  await Profile.deleteMany({
    $or: [
      { _id: { $in: profiles.map((p) => p._id) } },
      { fullName: { $in: profiles.map((p) => p.fullName) } },
    ],
  });
  await Profile.insertMany(profiles);
  console.log(`Inserted ${profiles.length} profiles, each pointing at a REAL category _id.`);

  await mongoose.disconnect();
  console.log('Done.');
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}

module.exports = { categories, profiles, CATEGORY_IDS };