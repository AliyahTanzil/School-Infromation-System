export const setupSteps = [
  {
    id: 'school',
    requires: [],
    title: 'Create your school',
    path: '/school-setup',
    source: '/schools',
    description:
      'Create the main school with its name and contact details. If it already exists, review its details before continuing.',
  },
  {
    id: 'year',
    requires: ['school'],
    title: 'Create an academic year',
    path: '/academic-calendar',
    source: '/academic-periods',
    description: 'Add the school year and its start and end dates, then activate the current year.',
    type: 'YEAR',
  },
  {
    id: 'term',
    requires: ['school', 'year'],
    title: 'Create terms',
    path: '/academic-calendar',
    source: '/academic-periods',
    description:
      'Create terms inside the academic year. Select the parent year and keep term dates within its dates.',
    type: 'TERM',
  },
  {
    id: 'classes',
    requires: ['school', 'year'],
    title: 'Create classes',
    path: '/classes',
    source: '/classes',
    description:
      'Add class names, school levels, sections, capacity, and academic year. Students and subjects can then be assigned to them.',
  },
  {
    id: 'teachers',
    requires: ['school'],
    title: 'Create teacher accounts',
    path: '/users',
    source: '/users',
    params: { pageSize: 100 },
    description:
      'In User management, create each staff account with account type Teacher. Add teaching profiles and assignments before building the timetable.',
  },
  {
    id: 'subjects',
    requires: ['school', 'classes'],
    title: 'Create subjects',
    path: '/subjects',
    source: '/subjects',
    description: 'Add subject names and codes, then select the classes that offer each subject.',
  },
  {
    id: 'students',
    requires: ['school', 'classes'],
    title: 'Add students',
    path: '/students',
    source: '/students',
    description:
      'Create student records, then open a class to enroll students and link their guardians.',
  },
];

export const followOnSteps = [
  {
    path: '/school-setup',
    title: 'Branches',
    requires: ['school'],
    description: 'Add branches if your school operates across multiple locations.',
  },
  {
    path: '/classes',
    title: 'Enrollment and assignments',
    requires: ['classes', 'teachers', 'subjects', 'students'],
    description:
      'Open each class and follow its setup checklist: activate the class, enroll students, and attach subjects. Continue to timetables for teaching assignments.',
  },
  {
    path: '/timetables',
    title: 'Timetables',
    requires: ['year', 'term', 'classes', 'teachers', 'subjects'],
    description:
      'Set up rooms, teaching assignments, and teacher availability; resolve readiness issues before publishing.',
  },
  {
    path: '/academic-policies',
    title: 'Grading policies',
    requires: ['school'],
    description:
      'Set grade bands, pass marks, and assessment weights before examinations and results.',
  },
  {
    path: '/finance',
    title: 'School fees',
    requires: ['year', 'term', 'classes', 'students'],
    description: 'Set up fees before issuing student invoices or recording payments.',
  },
  {
    path: '/attendance',
    title: 'Daily attendance',
    requires: ['classes', 'students'],
    description: 'Once students are enrolled in classes, open registers and mark attendance.',
  },
  {
    path: '/examinations',
    title: 'Examinations and results',
    requires: ['year', 'term', 'classes', 'subjects', 'students'],
    description: 'Prepare exam sessions after classes, subjects, and grading policies are ready.',
  },
  {
    path: '/communication',
    title: 'Family communication',
    requires: ['students'],
    description:
      'Create parent accounts and link guardians to students before using family communication.',
  },
];

export function hasSetupRecord(data, step) {
  const items = Array.isArray(data) ? data : data?.items;
  if (!Array.isArray(items)) throw new Error('Unexpected setup response');
  if (step.id === 'teachers') return items.some((item) => item.accountType === 'TEACHER');
  return step.type ? items.some((item) => item.type === step.type) : items.length > 0;
}
