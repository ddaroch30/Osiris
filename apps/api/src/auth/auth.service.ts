import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  async signIn(email: string, password: string) {
    if (email !== 'owner@demo.com' || password !== 'Password123!') {
      throw new UnauthorizedException('Invalid credentials');
    }
    return {
      accessToken: 'demo-jwt-token',
      user: { id: 'usr_demo_owner', email, organizationId: 'org_demo', role: 'ORG_OWNER' }
    };
  }
}
