import { router, publicProcedure } from '../trpc';

export const categoryRouter = router({
  /**
   * Get all active categories
   * PUBLIC
   */
  getAll: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.prisma.category.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        color: true,
      },
    });

    return categories;
  }),
});
