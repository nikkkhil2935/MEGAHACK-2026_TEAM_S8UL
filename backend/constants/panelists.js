const PANELISTS = [
  {
    id: 'alex',
    name: 'Alex Chen',
    role: 'Technical Lead',
    avatar_color: '#0fa8a8',
    personality: 'Direct, technically rigorous, values depth over breadth. Asks about architecture decisions, code quality, and system design. Probes technical claims with follow-up questions.',
    question_types: ['technical', 'situational'],
    question_count: 4,
  },
  {
    id: 'sarah',
    name: 'Sarah Miller',
    role: 'HR Manager',
    avatar_color: '#a855f7',
    personality: 'Warm but perceptive, focuses on cultural fit, motivation, and career trajectory. Evaluates communication skills and interpersonal awareness.',
    question_types: ['behavioral', 'motivation'],
    question_count: 3,
  },
  {
    id: 'david',
    name: 'David Park',
    role: 'Behavioral Analyst',
    avatar_color: '#f59e0b',
    personality: 'Analytical and observant, specializes in STAR framework evaluation. Probes for leadership, conflict resolution, and problem-solving patterns.',
    question_types: ['behavioral', 'situational'],
    question_count: 3,
  },
];

module.exports = { PANELISTS };
