import { nanoid } from 'nanoid';

const base = (text) =>
  text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/// Generates a unique slug for any Prisma model that has a `slug` column.
export async function slugify(model, text) {
  const candidate = base(text) || 'item';
  const taken = await model.findUnique({ where: { slug: candidate } });
  return taken ? `${candidate}-${nanoid(6).toLowerCase()}` : candidate;
}
