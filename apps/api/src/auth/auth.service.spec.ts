import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const jwt = new JwtService({ secret: 'unit-test-secret-32-chars-minimum' });

  it('rejects duplicate email registration with ConflictException', async () => {
    const db: any = {
      one: jest.fn().mockResolvedValueOnce({ id: 'existing-user' }),
    };
    const svc = new AuthService(db, jwt);

    await expect(
      svc.register({
        companyName: 'Test Co',
        email: 'admin@test.local',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'Admin',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('authenticates valid credentials and issues JWT + refresh token', async () => {
    const passwordHash = await bcrypt.hash('Demo1234!', 10);
    const db: any = {
      one: jest.fn().mockResolvedValueOnce({
        id: 'u-1',
        email: 'admin@demo.local',
        passwordHash,
        firstName: 'Kasun',
        lastName: 'Jayawardena',
        role: 'COMPANY_ADMIN',
        status: 'ACTIVE',
        companyId: 'c-1',
        companyName: 'Lanka Precision Engineering PLC',
      }),
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    };
    const svc = new AuthService(db, jwt);

    const res = await svc.login({ email: 'admin@demo.local', password: 'Demo1234!' });
    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toHaveLength(64);
    expect(res.user.role).toBe('COMPANY_ADMIN');
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('rejects suspended accounts with UnauthorizedException', async () => {
    const passwordHash = await bcrypt.hash('Demo1234!', 10);
    const db: any = {
      one: jest.fn().mockResolvedValueOnce({
        id: 'u-2',
        email: 'suspended@demo.local',
        passwordHash,
        status: 'SUSPENDED',
      }),
    };
    const svc = new AuthService(db, jwt);

    await expect(
      svc.login({ email: 'suspended@demo.local', password: 'Demo1234!' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
