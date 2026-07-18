import bcrypt from 'bcryptjs';
import { prisma } from './src/config/db.js';

const DEFAULT_PASSWORD = 'Smith@lms123';

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

const userSeeds = [
  {
    name: 'Adetoye Daniel',
    email: 'adetoyedaniel@gmail.com',
    role: 'ADMIN' as const,
    isVerified: true,
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah@lms.com',
    role: 'INSTRUCTOR' as const,
    isVerified: true,
  },
  {
    name: 'Michael Chen',
    email: 'michael@lms.com',
    role: 'INSTRUCTOR' as const,
    isVerified: true,
  },
  {
    name: 'Amina Yusuf',
    email: 'amina@student.com',
    role: 'STUDENT' as const,
    isVerified: true,
  },
  {
    name: 'Daniel Brooks',
    email: 'daniel@student.com',
    role: 'STUDENT' as const,
    isVerified: true,
  },
];

const courseSeeds = [
  {
    slug: 'complete-react-development',
    title: 'Complete React Development',
    description:
      'Learn modern React concepts, hooks, state management, routing, and deployment through hands-on projects.',
    category: 'Web Development',
    level: 'INTERMEDIATE' as const,
    duration: 420,
    rating: 4.8,
    thumbnail:
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80',
    instructorEmail: 'sarah@lms.com',
    modules: [
      {
        title: 'React Fundamentals',
        description: 'Core concepts and component architecture.',
        order: 1,
        lessons: [
          {
            title: 'Introduction to React',
            description: 'What React is and why it is popular.',
            content: 'React allows you to build user interfaces using components and a declarative model.',
            videoUrl: 'https://www.youtube.com/watch?v=N3AkSS5hXMA&t=27s',
            order: 1,
          },
          {
            title: 'JSX and Components',
            description: 'Create reusable UI with JSX and components.',
            content: 'Learn how JSX compiles to JavaScript and how to structure components.',
            videoUrl: 'https://www.youtube.com/watch?v=V-RwRsHYXDM',
            order: 2,
          },
        ],
      },
      {
        title: 'State and Hooks',
        description: 'Manage state and side effects in React apps.',
        order: 2,
        lessons: [
          {
            title: 'useState and useEffect',
            description: 'Manage local state and lifecycle effects.',
            content: 'Use hooks to handle state updates and effects cleanly.',
            videoUrl: 'https://www.youtube.com/watch?v=V9i3cGD-mts&t=20s&pp=ygUPU3RhdGUgYW5kIEhvb2tz',
            order: 1,
          },
        ],
      },
    ],
    // Assignments are attached to a specific lesson. They show up in the
    // Assignments page and at the bottom of the course page once the
    // student is enrolled.
    assignments: [
      {
        lessonTitle: 'useState and useEffect',
        title: 'Build a Todo App with React Hooks',
        description: 'Apply useState and useEffect by building a small, working todo application.',
        instructions:
          'Create a React app that lets users add, complete, and delete todo items using hooks only (no class components). Push your code to a public repo or zip it up, and submit the link/file below.',
        dueDate: daysFromNow(14),
        maxScore: 100,
      },
    ],
  },
  {
    slug: 'nodejs-backend-masterclass',
    title: 'Node.js Backend Masterclass',
    description:
      'Build scalable backend services with Node.js, Express, authentication, and database integration.',
    category: 'Backend Development',
    level: 'ADVANCED' as const,
    duration: 540,
    rating: 4.9,
    thumbnail:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5nI7oTWG6X-3nTITpAR8ewAyzO2NOCyZGCw8oSNbkbg&s',
    instructorEmail: 'michael@lms.com',
    modules: [
      {
        title: 'Backend Fundamentals',
        description: 'Understanding server architecture and APIs.',
        order: 1,
        lessons: [
          {
            title: 'Setting Up Express',
            description: 'Create a robust API foundation.',
            content: 'Express helps you define routes, middleware, and request handling.',
            videoUrl: 'https://www.youtube.com/watch?v=KOutPbKc9UM&pp=ygVgQnVpbGQgc2NhbGFibGUgYmFja2VuZCBzZXJ2aWNlcyB3aXRoIE5vZGUuanMsIEV4cHJlc3MsIGF1dGhlbnRpY2F0aW9uLCBhbmQgZGF0YWJhc2UgaW50ZWdyYXRpb24u',
            order: 1,
          },
        ],
      },
      {
        title: 'Authentication and Security',
        description: 'Protect your APIs with secure authentication flows.',
        order: 2,
        lessons: [
          {
            title: 'JWT Authentication',
            description: 'Implement token-based authentication.',
            content: 'JWTs provide a simple way to secure protected routes.',
            videoUrl: 'https://www.youtube.com/watch?v=JWTAuthentication',
            order: 1,
          },
        ],
      },
    ],
    assignments: [
      {
        lessonTitle: 'JWT Authentication',
        title: 'Secure a REST API with JWT',
        description: 'Implement login, protected routes, and token refresh in an Express API.',
        instructions:
          'Build (or extend a starter) Express API with a /login route that issues a JWT, and at least one protected route that verifies it. Submit your project as a zip or a link to your repo.',
        dueDate: daysFromNow(21),
        maxScore: 100,
      },
    ],
  },
  {
    slug: 'uiux-design-principles',
    title: 'UI/UX Design Principles',
    description:
      'Master user-centered design, wireframing, interface patterns, and accessibility essentials.',
    category: 'Design',
    level: 'BEGINNER' as const,
    duration: 300,
    rating: 4.7,
    thumbnail:
      'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80',
    instructorEmail: 'sarah@lms.com',
    modules: [
      {
        title: 'Design Thinking',
        description: 'Understand how to solve problems from the user perspective.',
        order: 1,
        lessons: [
          {
            title: 'What is UX?',
            description: 'An introduction to user experience.',
            content: 'UX focuses on making products meaningful and delightful.',
            videoUrl: 'https://www.youtube.com/watch?v=ODpB9-MCa5s&pp=ygUXVUkvVVggRGVzaWduIFByaW5jaXBsZXM%3D',
            order: 1,
          },
        ],
      },
    ],
    assignments: [
      {
        lessonTitle: 'What is UX?',
        title: 'Wireframe a Simple App Screen',
        description: 'Practice user-centered design by wireframing a single screen from scratch.',
        instructions:
          'Pick any app idea and wireframe its home screen (low-fidelity is fine). Export it as a PDF or image and submit it below, with a short note on the user need it addresses.',
        dueDate: daysFromNow(10),
        maxScore: 100,
      },
    ],
  },
];

async function ensureUser(seed: (typeof userSeeds)[number]) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  return prisma.user.upsert({
    where: { email: seed.email },
    update: {
      name: seed.name,
      role: seed.role,
      isVerified: seed.isVerified,
      password: passwordHash,
    },
    create: {
      name: seed.name,
      email: seed.email,
      password: passwordHash,
      role: seed.role,
      isVerified: seed.isVerified,
    },
  });
}

async function ensureCourse(courseSeed: (typeof courseSeeds)[number], instructorId: string) {
  const course = await prisma.course.upsert({
    where: { slug: courseSeed.slug },
    update: {
      title: courseSeed.title,
      description: courseSeed.description,
      category: courseSeed.category,
      level: courseSeed.level,
      duration: courseSeed.duration,
      rating: courseSeed.rating,
      thumbnail: courseSeed.thumbnail,
      published: true,
      instructorId,
    },
    create: {
      title: courseSeed.title,
      slug: courseSeed.slug,
      description: courseSeed.description,
      category: courseSeed.category,
      level: courseSeed.level,
      duration: courseSeed.duration,
      rating: courseSeed.rating,
      thumbnail: courseSeed.thumbnail,
      published: true,
      instructorId,
    },
  });

  for (const moduleSeed of courseSeed.modules) {
    let module = await prisma.module.findFirst({
      where: {
        courseId: course.id,
        title: moduleSeed.title,
      },
    });

    if (!module) {
      module = await prisma.module.create({
        data: {
          title: moduleSeed.title,
          description: moduleSeed.description,
          order: moduleSeed.order,
          courseId: course.id,
        },
      });
    } else {
      module = await prisma.module.update({
        where: { id: module.id },
        data: {
          title: moduleSeed.title,
          description: moduleSeed.description,
          order: moduleSeed.order,
        },
      });
    }

    for (const lessonSeed of moduleSeed.lessons) {
      const existingLesson = await prisma.lesson.findFirst({
        where: {
          moduleId: module.id,
          title: lessonSeed.title,
        },
      });

      if (!existingLesson) {
        await prisma.lesson.create({
          data: {
            title: lessonSeed.title,
            description: lessonSeed.description,
            content: lessonSeed.content,
            videoUrl: lessonSeed.videoUrl,
            order: lessonSeed.order,
            moduleId: module.id,
          },
        });
      } else {
        await prisma.lesson.update({
          where: { id: existingLesson.id },
          data: {
            description: lessonSeed.description,
            content: lessonSeed.content,
            videoUrl: lessonSeed.videoUrl,
            order: lessonSeed.order,
          },
        });
      }
    }
  }

  return course;
}

async function ensureAssignments(courseSeed: (typeof courseSeeds)[number], courseId: string) {
  const assignmentSeeds = (courseSeed as any).assignments as
    | {
        lessonTitle: string;
        title: string;
        description: string;
        instructions?: string;
        dueDate: Date;
        maxScore: number;
      }[]
    | undefined;

  if (!assignmentSeeds?.length) return;

  for (const a of assignmentSeeds) {
    const lesson = await prisma.lesson.findFirst({
      where: { title: a.lessonTitle, module: { courseId } },
    });
    if (!lesson) {
      console.warn(`⚠️  Skipping assignment "${a.title}" — lesson "${a.lessonTitle}" not found.`);
      continue;
    }

    const existing = await prisma.assignment.findFirst({
      where: { lessonId: lesson.id, title: a.title },
    });

    if (!existing) {
      await prisma.assignment.create({
        data: {
          title: a.title,
          description: a.description,
          instructions: a.instructions,
          dueDate: a.dueDate,
          maxScore: a.maxScore,
          lessonId: lesson.id,
        },
      });
    } else {
      await prisma.assignment.update({
        where: { id: existing.id },
        data: {
          description: a.description,
          instructions: a.instructions,
          dueDate: a.dueDate,
          maxScore: a.maxScore,
        },
      });
    }
  }
}

async function main() {
  console.log('🌱 Seeding LMS database...');

  const users = await Promise.all(userSeeds.map((seed) => ensureUser(seed)));
  const admin = users.find((user) => user.role === 'ADMIN');
  const instructors = users.filter((user) => user.role === 'INSTRUCTOR');
  const students = users.filter((user) => user.role === 'STUDENT');

  if (!admin) {
    throw new Error('Admin user was not created.');
  }

  for (const courseSeed of courseSeeds) {
    const instructor = instructors.find((user) => user.email === courseSeed.instructorEmail);
    if (!instructor) {
      throw new Error(`Instructor not found for course ${courseSeed.slug}`);
    }

    const course = await ensureCourse(courseSeed, instructor.id);
    await ensureAssignments(courseSeed, course.id);

    for (const student of students) {
      await prisma.enrollment.upsert({
        where: {
          studentId_courseId: {
            studentId: student.id,
            courseId: course.id,
          },
        },
        update: {
          progress: 10,
          completed: false,
        },
        create: {
          studentId: student.id,
          courseId: course.id,
          progress: 10,
          completed: false,
        },
      });
    }
  }

  console.log('✅ Seed completed successfully.');
  console.log('Sample login credentials:');
  console.log('Admin: adetoyedaniel@gmail.com / Smith@lms123');
  console.log('Instructor: sarah@lms.com / Smith@lms123');
  console.log('Student: amina@student.com / Smith@lms123');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });