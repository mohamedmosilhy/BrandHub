import {
  otpChallengeDtoSchema,
  otpVerifiedDtoSchema,
  refreshDtoSchema,
  sessionDtoSchema,
  userDtoSchema,
  type OtpChallengeDto,
  type RefreshDto,
  type SessionDto,
  type UserDto,
} from '@data/identity/dto';
import { parseResponse } from '@data/shared';

import type { HttpClient } from '@infrastructure/http';

export class AuthRemoteDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  async signIn(email: string, password: string): Promise<SessionDto> {
    const endpoint = '/auth/login';
    const response = await this.httpClient.request<unknown>({
      method: 'POST',
      endpoint,
      body: { email, password },
    });
    return parseResponse(
      sessionDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  async registerCustomer(input: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<UserDto> {
    const endpoint = '/auth/register';
    const response = await this.httpClient.request<unknown>({
      method: 'POST',
      endpoint,
      body: input,
    });
    return parseResponse(
      userDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  async registerSeller(input: {
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
  }): Promise<UserDto> {
    const endpoint = '/auth/register/seller';
    const response = await this.httpClient.request<unknown>({
      method: 'POST',
      endpoint,
      body: input,
    });
    return parseResponse(
      userDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  async refresh(refreshToken: string): Promise<RefreshDto> {
    const endpoint = '/auth/refresh';
    const response = await this.httpClient.request<unknown>({
      method: 'POST',
      endpoint,
      body: { refreshToken },
    });
    return parseResponse(
      refreshDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  async signOut(refreshToken: string): Promise<void> {
    await this.httpClient.request({
      method: 'POST',
      endpoint: '/auth/logout',
      body: { refreshToken },
    });
  }

  /** Mock-only endpoints; see D12 / FA1. */
  async sendPhoneOtp(phone: string): Promise<OtpChallengeDto> {
    const endpoint = '/auth/phone/send-otp';
    const response = await this.httpClient.request<unknown>({
      method: 'POST',
      endpoint,
      body: { phone },
    });
    return parseResponse(
      otpChallengeDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  /** Mock-only endpoints; see D12 / FA1. */
  async verifyPhoneOtp(challengeId: string, code: string): Promise<void> {
    const endpoint = '/auth/phone/verify-otp';
    const response = await this.httpClient.request<unknown>({
      method: 'POST',
      endpoint,
      body: { challengeId, code },
    });
    parseResponse(
      otpVerifiedDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }
}
