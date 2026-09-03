export type AccountType = 'customer' | 'seller';

export type User = Readonly<{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  accountType: AccountType;
}>;

export type Session = Readonly<{
  accessToken: string;
  refreshToken: string;
  user: User;
}>;

export type SellerPendingApproval = Readonly<{
  kind: 'sellerPendingApproval';
  email: string;
}>;

export type SignUpResult =
  Readonly<{ kind: 'authenticated'; session: Session }> | SellerPendingApproval;

export type OtpChallenge = Readonly<{
  challengeId: string;
  expiresInSeconds: number;
}>;
