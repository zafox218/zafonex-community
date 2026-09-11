import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notFound, forbidden, badRequest } from '../../lib/errors.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { slugify } from '../../lib/slug.js';

export const coursesRouter = Router();

const courseSchema = z.object({
  title: z.string().min(8).max(120),
  summary: z.string().min(20).max(240),
  description: z.string().min(40),
  priceUsdt: z.coerce.number().min(0),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  language: z.string().min(2).max(5).default('en'),
  categoryId: z.string().optional(),
  coverUrl: z.string().url().optional(),
  tags: z.array(z.string()).max(8).default([]),
});

coursesRouter.get('/', asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 12), 48);
  const where = { status: 'PUBLISHED', ...(req.query.level ? { level: String(req.query.level) } : {}) };

  const [items, total] = await Promise.all([
    prisma.course.findMany({
      where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
      include: {
        instructor: { select: { username: true, displayName: true, avatarUrl: true } },
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}));

/// Full curriculum is only expanded for enrolled students; others see previews.
coursesRouter.get('/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { slug: req.params.slug },
    include: {
      instructor: { select: { username: true, displayName: true, avatarUrl: true, headline: true } },
      modules: { orderBy: { position: 'asc' }, include: { lessons: { orderBy: { position: 'asc' } } } },
      _count: { select: { enrollments: true } },
    },
  });
  if (!course) throw notFound('Course not found');

  const enrolled = req.user
    ? await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: req.user.id, courseId: course.id } } })
    : null;

  const isOwner = req.user?.id === course.instructorId || req.user?.role === 'ADMIN';

  if (!enrolled && !isOwner) {
    course.modules = course.modules.map((m) => ({
      ...m,
      lessons: m.lessons.map((l) => (l.isPreview ? l : { ...l, videoUrl: null, content: null, locked: true })),
    }));
  }

  res.json({ course, enrolled: Boolean(enrolled) });
}));

coursesRouter.post('/', requireAuth, requireRole('SELLER', 'ADMIN'),
  validate({ body: courseSchema }), asyncHandler(async (req, res) => {
    const course = await prisma.course.create({
      data: {
        ...req.body,
        priceUsdt: req.body.priceUsdt.toFixed(6),
        slug: await slugify(prisma.course, req.body.title),
        instructorId: req.user.id,
      },
    });
    res.status(201).json({ course });
  }));

coursesRouter.post('/:id/modules', requireAuth, asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course) throw notFound('Course not found');
  if (course.instructorId !== req.user.id && req.user.role !== 'ADMIN') throw forbidden();

  const count = await prisma.module.count({ where: { courseId: course.id } });
  const mod = await prisma.module.create({
    data: { courseId: course.id, title: req.body.title, position: count + 1 },
  });
  res.status(201).json({ module: mod });
}));

coursesRouter.post('/lessons/:lessonId/progress', requireAuth, asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: req.params.lessonId },
    include: { module: true },
  });
  if (!lesson) throw notFound('Lesson not found');

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.user.id, courseId: lesson.module.courseId } },
  });
  if (!enrollment) throw badRequest('You are not enrolled in this course');

  await prisma.lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: lesson.id } },
    update: { completed: true, secondsWatched: req.body.secondsWatched ?? 0 },
    create: { enrollmentId: enrollment.id, lessonId: lesson.id, completed: true, secondsWatched: req.body.secondsWatched ?? 0 },
  });

  const [done, total] = await Promise.all([
    prisma.lessonProgress.count({ where: { enrollmentId: enrollment.id, completed: true } }),
    prisma.lesson.count({ where: { module: { courseId: lesson.module.courseId } } }),
  ]);

  const pct = total ? (done / total) * 100 : 0;
  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { progressPct: pct, completedAt: pct >= 100 ? new Date() : null },
  });

  res.json({ progressPct: pct });
}));
