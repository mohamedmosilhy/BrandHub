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
      /**
       * The gateway's return. Its query — status, amount, gatewayOrderId, reference — is parsed
       * into the route's params by React Navigation, so a return that arrives after the app was
       * killed lands on the same screen with the same information as one caught by the in-app
       * browser session (§28 S9: every param is validated by the screen before use).
       */
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
