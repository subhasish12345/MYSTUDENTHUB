export type Notice = {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  isNew: boolean;
};

export type Event = {
  id: string;
  title: string;
  date: Date;
  description: string;
  location: string;
};

export type Assignment = {
    id: string;
    subject: string;
    title: string;
    dueDate: string;
    status: 'Pending' | 'Submitted' | 'Graded';
};

export type Post = {
    id: string;
    author: {
        name: string;
        avatarUrl: string;
    };
    content: string;
    timestamp: string;
};

export const notices: Notice[] = [
  { id: '1', title: 'Mid-term Exam Schedule', content: 'The schedule for the upcoming mid-term examinations has been published. Please check the student portal.', author: 'Admin', date: '2 days ago', isNew: true },
  { id: '2', title: 'Library Renovation', content: 'The main library will be closed for renovation from July 15th to July 20th. E-resources will remain available.', author: 'Admin', date: '5 days ago', isNew: false },
  { id: '3', title: 'Annual Sports Day', content: 'Get ready for the annual sports day on August 1st! Registrations are now open.', author: 'Student Council', date: '1 week ago', isNew: false },
];

export const events: Event[] = [
    { id: '1', title: 'Guest Lecture: AI in Healthcare', date: new Date(new Date().setDate(new Date().getDate() + 5)), description: 'By Dr. Evelyn Reed, a leading expert in medical AI.', location: 'Auditorium A' },
    { id: '2', title: 'Workshop: Modern Web Development', date: new Date(new Date().setDate(new Date().getDate() + 10)), description: 'Hands-on workshop on React and Next.js.', location: 'Lab 303' },
    { id: '3', title: 'Coding Hackathon 2024', date: new Date(new Date().setDate(new Date().getDate() + 20)), description: '24-hour hackathon with exciting prizes.', location: 'Main Hall' },
];

export const assignments: Assignment[] = [
    { id: '1', subject: 'Data Structures', title: 'Implement a binary search tree', dueDate: 'July 25, 2024', status: 'Pending' },
    { id: '2', subject: 'Operating Systems', title: 'Process scheduling simulation', dueDate: 'July 28, 2024', status: 'Pending' },
    { id: '3', subject: 'Database Systems', title: 'Design a relational schema for a social network', dueDate: 'July 22, 2024', status: 'Submitted' },
    { id: '4', subject: 'Software Engineering', title: 'Final Project Proposal', dueDate: 'July 15, 2024', status: 'Graded' },
];

export const posts: Post[] = [
    { id: '1', author: { name: 'Alice', avatarUrl: 'https://picsum.photos/seed/alice/40/40' }, content: 'Has anyone started the Data Structures assignment? I\'m finding the recursion part a bit tricky.', timestamp: '2 hours ago' },
    { id: '2', author: { name: 'Bob', avatarUrl: 'https://picsum.photos/seed/bob/40/40' }, content: 'Yeah, I\'m working on it. Happy to form a study group if anyone is interested. We could meet at the library tomorrow.', timestamp: '1 hour ago' },
    { id: '3', author: { name: 'Charlie', avatarUrl: 'https://picsum.photos/seed/charlie/40/40' }, content: 'A study group sounds great! I\'m in. What time?', timestamp: '30 minutes ago' },
];