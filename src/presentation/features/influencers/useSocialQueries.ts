import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

import type {
  FollowInfluencerUseCase,
  GetInfluencerProfileUseCase,
  GetInfluencersUseCase,
  Influencer,
  InfluencerProfile,
} from '@domain/social';

import { socialKeys } from './queryKeys';

async function valueOf<T>(operation: Promise<Result<T, AppError>>) {
  const result = await operation;
  if (!result.ok) throw result.error;
  return result.value;
}

export function useInfluencers(useCase: GetInfluencersUseCase, locale: string) {
  return useQuery({
    queryKey: socialKeys.influencers(locale),
    queryFn: () => valueOf(useCase.execute()),
  });
}

export function useInfluencerProfile(
  useCase: GetInfluencerProfileUseCase,
  locale: string,
  id: string,
) {
  return useQuery({
    queryKey: socialKeys.profile(locale, id),
    queryFn: () => valueOf(useCase.execute(id)),
  });
}

/**
 * The follow button is optimistic (§16.5), like the wishlist heart: the directory row and the
 * open profile both hold the same relationship, so both caches are rewritten before the request
 * leaves and both are restored together if it fails. Without that, following from the profile
 * would leave the list behind it showing "Follow" until the next refetch.
 */
export function useFollowInfluencer({
  useCase,
  locale,
  onFailure,
}: {
  useCase: FollowInfluencerUseCase;
  locale: string;
  onFailure: () => void;
}) {
  const client = useQueryClient();
  const listKey = socialKeys.influencers(locale);

  return useMutation({
    mutationFn: ({ id, following }: { id: string; following: boolean }) =>
      valueOf(useCase.execute(id, following)),
    onMutate: async ({ id, following }) => {
      const profileKey = socialKeys.profile(locale, id);
      await Promise.all([
        client.cancelQueries({ queryKey: listKey }),
        client.cancelQueries({ queryKey: profileKey }),
      ]);
      const previousList = client.getQueryData<readonly Influencer[]>(listKey);
      const previousProfile =
        client.getQueryData<InfluencerProfile>(profileKey);

      client.setQueryData<readonly Influencer[]>(listKey, (current) =>
        current?.map((influencer) =>
          influencer.id === id
            ? { ...influencer, following: !following }
            : influencer,
        ),
      );
      client.setQueryData<InfluencerProfile>(profileKey, (current) =>
        current
          ? {
              ...current,
              influencer: { ...current.influencer, following: !following },
            }
          : current,
      );
      return { previousList, previousProfile, profileKey };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      client.setQueryData(listKey, context.previousList);
      client.setQueryData(context.profileKey, context.previousProfile);
      onFailure();
    },
    onSettled: (_data, _error, { id }) => {
      void client.invalidateQueries({ queryKey: listKey });
      void client.invalidateQueries({
        queryKey: socialKeys.profile(locale, id),
      });
    },
  });
}
