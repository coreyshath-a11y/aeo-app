export interface IndustryTemplate {
  id: string;
  name: string;
  questions: string[];
  expectedContent: string[];
}

export const GENERIC_QUESTIONS = [
  'How much does it cost?',
  'What are your hours?',
  'Where are you located?',
  'How do I book an appointment?',
  'Do you offer refunds?',
  'What payment methods do you accept?',
  'Do you have reviews?',
  'How do I contact you?',
  'What services do you offer?',
  'Are you open on weekends?',
];

export const GENERIC_EXPECTED_CONTENT = [
  'pricing',
  'hours',
  'location',
  'contact',
  'faq',
  'services',
  'about',
  'reviews',
  'booking',
  'policy',
];

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: 'restaurant',
    name: 'Restaurant',
    questions: [
      'What is on the menu?',
      'Do you take reservations?',
      'Is there outdoor seating?',
      'Do you deliver?',
      'Is it good for kids?',
      'Do you have vegetarian options?',
      ...GENERIC_QUESTIONS,
    ],
    expectedContent: [
      'menu',
      'reservation',
      'delivery',
      'vegetarian',
      'seating',
      ...GENERIC_EXPECTED_CONTENT,
    ],
  },
  {
    id: 'dentist',
    name: 'Dentist',
    questions: [
      'Do you accept my insurance?',
      'What dental services do you offer?',
      'Do you do emergency appointments?',
      'How much is a cleaning?',
      'Are you accepting new patients?',
      ...GENERIC_QUESTIONS,
    ],
    expectedContent: [
      'insurance',
      'emergency',
      'cleaning',
      'patients',
      'dental',
      ...GENERIC_EXPECTED_CONTENT,
    ],
  },
  {
    id: 'escape_room',
    name: 'Escape Room',
    questions: [
      'How long does it take?',
      'How many people per room?',
      'Is it scary?',
      'What should I bring?',
      'Do you offer corporate events?',
      'What is the difficulty level?',
      ...GENERIC_QUESTIONS,
    ],
    expectedContent: [
      'duration',
      'group size',
      'difficulty',
      'corporate',
      'theme',
      ...GENERIC_EXPECTED_CONTENT,
    ],
  },
  {
    id: 'real_estate',
    name: 'Real Estate',
    questions: [
      'What areas do you serve?',
      'Do you help with buying and selling?',
      'What is your commission?',
      'How do I get a home valuation?',
      'Do you work with first-time buyers?',
      ...GENERIC_QUESTIONS,
    ],
    expectedContent: [
      'listings',
      'commission',
      'valuation',
      'buyers',
      'sellers',
      ...GENERIC_EXPECTED_CONTENT,
    ],
  },
];
