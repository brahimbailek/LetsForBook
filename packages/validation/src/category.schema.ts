import { z } from 'zod';

// Create category schema
export const createCategorySchema = z.object({
  salonId: z.string().cuid('Invalid salon ID'),
  name: z.string().min(1, 'Le nom est requis').max(50, 'Le nom est trop long'),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hex invalide').optional(),
  parentId: z.string().cuid().optional(),
});

// Update category schema
export const updateCategorySchema = z.object({
  id: z.string().cuid('Invalid category ID'),
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// Delete category schema
export const deleteCategorySchema = z.object({
  id: z.string().cuid('Invalid category ID'),
});

// Reorder categories schema
export const reorderCategoriesSchema = z.object({
  salonId: z.string().cuid('Invalid salon ID'),
  categoryIds: z.array(z.string().cuid()).min(1, 'At least one category required'),
});

// Reorder services schema (batch update)
export const reorderServicesSchema = z.object({
  salonId: z.string().cuid('Invalid salon ID'),
  services: z.array(
    z.object({
      id: z.string().cuid(),
      categoryId: z.string().cuid(),
      order: z.number().int().min(0),
    })
  ).min(1),
});
