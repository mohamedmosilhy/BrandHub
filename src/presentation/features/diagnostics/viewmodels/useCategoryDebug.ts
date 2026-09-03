import { useQuery } from '@tanstack/react-query';

import type { CategoryRepository } from '@domain/catalog';

export function useCategoryDebug(repository: CategoryRepository) {
  return useQuery({
    queryKey: ['catalog', 'categories', 'tree'],
    queryFn: async () => {
      const result = await repository.getTree();
      if (!result.ok) throw result.error;
      return result.value;
    },
  });
}
