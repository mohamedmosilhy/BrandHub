import type { LinkingOptions } from '@react-navigation/native';

import type { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['brandhub://'],
  config: {
    screens: {
      Main: {
        screens: {
          HomeTab: {
            screens: {
              Home: '',
              Product: 'product/:productId',
              Category: 'category/:categoryId',
            },
          },
          InfluencersTab: {
            screens: { Influencer: 'influencer/:influencerId' },
          },
          AccountTab: {
            screens: { OrderDetail: 'order/:orderId' },
          },
        },
      },
      PaymentResult: 'payment/result',
      Auth: {
        screens: {
          Onboarding: 'welcome',
          Login: 'login',
        },
      },
    },
  },
};
