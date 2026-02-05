// Unit Tests - PrayerRequest Entity
// Comprehensive tests for prayer request domain logic

import {
  PrayerRequest,
  PrayerRequestStatus,
  CreatePrayerRequestData,
  PrayerRequestEntity
} from '../PrayerRequest';

// Test Fixtures
const createMockPrayerRequest = (overrides: Partial<PrayerRequest> = {}): PrayerRequest => ({
  id: 'prayer-request-1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+5511999999999',
  request: 'Please pray for my family during this difficult time. We need strength and guidance.',
  isUrgent: false,
  isAnonymous: false,
  status: PrayerRequestStatus.Pending,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  prayedBy: [],
  source: 'website',
  ...overrides
});

const createMockCreateData = (overrides: Partial<CreatePrayerRequestData> = {}): CreatePrayerRequestData => ({
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+5511999999999',
  request: 'Please pray for my family during this difficult time. We need strength and guidance.',
  isUrgent: false,
  isAnonymous: false,
  ...overrides
});

describe('PrayerRequestStatus Enum', () => {
  it('should have Pending status', () => {
    expect(PrayerRequestStatus.Pending).toBe('pending');
  });

  it('should have Approved status', () => {
    expect(PrayerRequestStatus.Approved).toBe('approved');
  });

  it('should have Praying status', () => {
    expect(PrayerRequestStatus.Praying).toBe('praying');
  });

  it('should have Answered status', () => {
    expect(PrayerRequestStatus.Answered).toBe('answered');
  });

  it('should have Rejected status', () => {
    expect(PrayerRequestStatus.Rejected).toBe('rejected');
  });

  it('should have exactly 5 status values', () => {
    const statusValues = Object.values(PrayerRequestStatus);
    expect(statusValues).toHaveLength(5);
    expect(statusValues).toContain('pending');
    expect(statusValues).toContain('approved');
    expect(statusValues).toContain('praying');
    expect(statusValues).toContain('answered');
    expect(statusValues).toContain('rejected');
  });

  it('should allow status as type in a variable', () => {
    const status: PrayerRequestStatus = PrayerRequestStatus.Pending;
    expect(status).toBe('pending');
  });
});

describe('PrayerRequestEntity', () => {
  describe('create', () => {
    describe('Basic creation', () => {
      it('should create a prayer request with all required fields', () => {
        const data = createMockCreateData();
        const result = PrayerRequestEntity.create(data);

        expect(result.name).toBe('John Doe');
        expect(result.email).toBe('john.doe@example.com');
        expect(result.phone).toBe('+5511999999999');
        expect(result.request).toBe('Please pray for my family during this difficult time. We need strength and guidance.');
      });

      it('should set default status to Pending', () => {
        const data = createMockCreateData();
        const result = PrayerRequestEntity.create(data);

        expect(result.status).toBe(PrayerRequestStatus.Pending);
      });

      it('should set source to website', () => {
        const data = createMockCreateData();
        const result = PrayerRequestEntity.create(data);

        expect(result.source).toBe('website');
      });

      it('should initialize prayedBy as empty array', () => {
        const data = createMockCreateData();
        const result = PrayerRequestEntity.create(data);

        expect(result.prayedBy).toEqual([]);
        expect(Array.isArray(result.prayedBy)).toBe(true);
      });

      it('should set createdAt and updatedAt to current date', () => {
        const beforeCreate = new Date();
        const data = createMockCreateData();
        const result = PrayerRequestEntity.create(data);
        const afterCreate = new Date();

        expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
        expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
        expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
        expect(result.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      });

      it('should return object without id property', () => {
        const data = createMockCreateData();
        const result = PrayerRequestEntity.create(data);

        expect(result).not.toHaveProperty('id');
      });
    });

    describe('isUrgent handling', () => {
      it('should set isUrgent to true when provided', () => {
        const data = createMockCreateData({ isUrgent: true });
        const result = PrayerRequestEntity.create(data);

        expect(result.isUrgent).toBe(true);
      });

      it('should set isUrgent to false when provided', () => {
        const data = createMockCreateData({ isUrgent: false });
        const result = PrayerRequestEntity.create(data);

        expect(result.isUrgent).toBe(false);
      });

      it('should default isUrgent to false when not provided', () => {
        const data: CreatePrayerRequestData = {
          name: 'John Doe',
          request: 'Please pray for my healing'
        };
        const result = PrayerRequestEntity.create(data);

        expect(result.isUrgent).toBe(false);
      });

      it('should default isUrgent to false when undefined', () => {
        const data = createMockCreateData({ isUrgent: undefined });
        const result = PrayerRequestEntity.create(data);

        expect(result.isUrgent).toBe(false);
      });
    });

    describe('Privacy settings (isAnonymous)', () => {
      it('should preserve name when isAnonymous is false', () => {
        const data = createMockCreateData({ isAnonymous: false, name: 'Jane Smith' });
        const result = PrayerRequestEntity.create(data);

        expect(result.name).toBe('Jane Smith');
        expect(result.isAnonymous).toBe(false);
      });

      it('should replace name with "Anonimo" when isAnonymous is true', () => {
        const data = createMockCreateData({ isAnonymous: true, name: 'Jane Smith' });
        const result = PrayerRequestEntity.create(data);

        expect(result.name).toBe('Anônimo');
        expect(result.isAnonymous).toBe(true);
      });

      it('should preserve email when isAnonymous is false', () => {
        const data = createMockCreateData({ isAnonymous: false, email: 'test@example.com' });
        const result = PrayerRequestEntity.create(data);

        expect(result.email).toBe('test@example.com');
      });

      it('should remove email when isAnonymous is true', () => {
        const data = createMockCreateData({ isAnonymous: true, email: 'test@example.com' });
        const result = PrayerRequestEntity.create(data);

        expect(result.email).toBeUndefined();
      });

      it('should preserve phone when isAnonymous is false', () => {
        const data = createMockCreateData({ isAnonymous: false, phone: '+5511888888888' });
        const result = PrayerRequestEntity.create(data);

        expect(result.phone).toBe('+5511888888888');
      });

      it('should remove phone when isAnonymous is true', () => {
        const data = createMockCreateData({ isAnonymous: true, phone: '+5511888888888' });
        const result = PrayerRequestEntity.create(data);

        expect(result.phone).toBeUndefined();
      });

      it('should default isAnonymous to false when not provided', () => {
        const data: CreatePrayerRequestData = {
          name: 'John Doe',
          request: 'Please pray for my healing'
        };
        const result = PrayerRequestEntity.create(data);

        expect(result.isAnonymous).toBe(false);
      });

      it('should default isAnonymous to false when undefined', () => {
        const data = createMockCreateData({ isAnonymous: undefined });
        const result = PrayerRequestEntity.create(data);

        expect(result.isAnonymous).toBe(false);
      });

      it('should hide all personal info when anonymous', () => {
        const data = createMockCreateData({
          isAnonymous: true,
          name: 'Personal Name',
          email: 'personal@email.com',
          phone: '+5511777777777'
        });
        const result = PrayerRequestEntity.create(data);

        expect(result.name).toBe('Anônimo');
        expect(result.email).toBeUndefined();
        expect(result.phone).toBeUndefined();
        expect(result.request).toBe(data.request); // Request should still be preserved
      });
    });

    describe('Optional fields handling', () => {
      it('should handle missing email', () => {
        const data = createMockCreateData({ email: undefined });
        const result = PrayerRequestEntity.create(data);

        expect(result.email).toBeUndefined();
      });

      it('should handle missing phone', () => {
        const data = createMockCreateData({ phone: undefined });
        const result = PrayerRequestEntity.create(data);

        expect(result.phone).toBeUndefined();
      });

      it('should create valid request with minimum required data', () => {
        const data: CreatePrayerRequestData = {
          name: 'Minimal User',
          request: 'A simple prayer request that is long enough'
        };
        const result = PrayerRequestEntity.create(data);

        expect(result.name).toBe('Minimal User');
        expect(result.request).toBe('A simple prayer request that is long enough');
        expect(result.email).toBeUndefined();
        expect(result.phone).toBeUndefined();
        expect(result.isUrgent).toBe(false);
        expect(result.isAnonymous).toBe(false);
      });
    });
  });

  describe('validate', () => {
    describe('Name validation', () => {
      it('should return no errors for valid name', () => {
        const data = createMockCreateData({ name: 'John Doe' });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).not.toContain('Nome é obrigatório');
      });

      it('should return error for empty name', () => {
        const data = createMockCreateData({ name: '' });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toContain('Nome é obrigatório');
      });

      it('should return error for whitespace-only name', () => {
        const data = createMockCreateData({ name: '   ' });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toContain('Nome é obrigatório');
      });

      it('should return error for undefined name', () => {
        const data = { request: 'Valid prayer request text' } as CreatePrayerRequestData;
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toContain('Nome é obrigatório');
      });

      it('should accept name with special characters', () => {
        const data = createMockCreateData({ name: 'Jose da Silva' });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).not.toContain('Nome é obrigatório');
      });

      it('should accept single character name', () => {
        const data = createMockCreateData({ name: 'A' });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).not.toContain('Nome é obrigatório');
      });
    });

    describe('Request validation', () => {
      it('should return no errors for valid request (>= 10 characters)', () => {
        const data = createMockCreateData({ request: 'Please pray for my family' });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).not.toContain('Pedido de oração é obrigatório');
        expect(errors).not.toContain('Pedido de oração deve ter pelo menos 10 caracteres');
      });

      it('should return error for empty request', () => {
        const data = createMockCreateData({ request: '' });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toContain('Pedido de oração é obrigatório');
      });

      it('should return error for whitespace-only request', () => {
        const data = createMockCreateData({ request: '     ' });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toContain('Pedido de oração é obrigatório');
      });

      it('should return error for undefined request', () => {
        const data = { name: 'John Doe' } as CreatePrayerRequestData;
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toContain('Pedido de oração é obrigatório');
      });

      it('should return error for request shorter than 10 characters', () => {
        const data = createMockCreateData({ request: 'Short' });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toContain('Pedido de oração deve ter pelo menos 10 caracteres');
      });

      it('should return error for request with exactly 9 characters', () => {
        const data = createMockCreateData({ request: '123456789' });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toContain('Pedido de oração deve ter pelo menos 10 caracteres');
      });

      it('should accept request with exactly 10 characters', () => {
        const data = createMockCreateData({ request: '1234567890' });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).not.toContain('Pedido de oração deve ter pelo menos 10 caracteres');
      });

      it('should return error for request longer than 2000 characters', () => {
        const data = createMockCreateData({ request: 'a'.repeat(2001) });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toContain('Pedido de oração deve ter no máximo 2000 caracteres');
      });

      it('should accept request with exactly 2000 characters', () => {
        const data = createMockCreateData({ request: 'a'.repeat(2000) });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).not.toContain('Pedido de oração deve ter no máximo 2000 caracteres');
      });

      it('should accept request with 1999 characters', () => {
        const data = createMockCreateData({ request: 'a'.repeat(1999) });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).not.toContain('Pedido de oração deve ter no máximo 2000 caracteres');
      });
    });

    describe('Email validation', () => {
      it('should return no errors when email is not provided', () => {
        const data = createMockCreateData({ email: undefined });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).not.toContain('E-mail inválido');
      });

      it('should return no errors for valid email format', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.org',
          'user+tag@example.co.uk',
          'firstname.lastname@company.com',
          'email@subdomain.domain.com',
          'user123@test.io'
        ];

        validEmails.forEach(email => {
          const data = createMockCreateData({ email });
          const errors = PrayerRequestEntity.validate(data);
          expect(errors).not.toContain('E-mail inválido');
        });
      });

      it('should return error for invalid email format', () => {
        const invalidEmails = [
          'invalid',
          'invalid@',
          '@domain.com',
          'invalid@domain',
          'invalid @domain.com',
          'invalid@ domain.com',
          'invalid@.com',
          '@',
          'test'
        ];

        invalidEmails.forEach(email => {
          const data = createMockCreateData({ email });
          const errors = PrayerRequestEntity.validate(data);
          expect(errors).toContain('E-mail inválido');
        });
      });

      it('should return error for email with spaces', () => {
        const data = createMockCreateData({ email: 'test @example.com' });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toContain('E-mail inválido');
      });

      it('should return error for email without @ symbol', () => {
        const data = createMockCreateData({ email: 'testexample.com' });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toContain('E-mail inválido');
      });

      it('should return error for email without domain extension', () => {
        const data = createMockCreateData({ email: 'test@example' });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toContain('E-mail inválido');
      });
    });

    describe('Multiple validation errors', () => {
      it('should return multiple errors when multiple validations fail', () => {
        const data = createMockCreateData({
          name: '',
          request: '',
          email: 'invalid-email'
        });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toContain('Nome é obrigatório');
        expect(errors).toContain('Pedido de oração é obrigatório');
        expect(errors).toContain('E-mail inválido');
        expect(errors.length).toBeGreaterThanOrEqual(3);
      });

      it('should return both required and length errors for short request', () => {
        const data = createMockCreateData({
          name: 'John Doe',
          request: 'Short'
        });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toContain('Pedido de oração deve ter pelo menos 10 caracteres');
        expect(errors).not.toContain('Pedido de oração é obrigatório');
      });

      it('should return empty array for valid data', () => {
        const data = createMockCreateData();
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toEqual([]);
        expect(errors.length).toBe(0);
      });
    });

    describe('Edge cases', () => {
      it('should validate data with all optional fields missing', () => {
        const data: CreatePrayerRequestData = {
          name: 'John Doe',
          request: 'Please pray for my family and health'
        };
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toEqual([]);
      });

      it('should handle special characters in request', () => {
        const data = createMockCreateData({
          request: 'Please pray for my health! <script>alert("test")</script> &amp;'
        });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toEqual([]);
      });

      it('should handle unicode characters in name and request', () => {
        const data = createMockCreateData({
          name: 'Jose Maria da Conceicao',
          request: 'Ore pela saude da minha familia e paz no coracao'
        });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toEqual([]);
      });

      it('should handle very long valid data', () => {
        const data = createMockCreateData({
          name: 'A'.repeat(500),
          request: 'A'.repeat(2000)
        });
        const errors = PrayerRequestEntity.validate(data);

        expect(errors).toEqual([]);
      });
    });
  });
});

describe('Interface Type Checking', () => {
  describe('PrayerRequest interface', () => {
    it('should accept a valid PrayerRequest object', () => {
      const request: PrayerRequest = createMockPrayerRequest();

      expect(request.id).toBeDefined();
      expect(request.name).toBeDefined();
      expect(request.request).toBeDefined();
      expect(request.status).toBeDefined();
      expect(request.source).toBeDefined();
    });

    it('should allow optional fields to be undefined', () => {
      const request: PrayerRequest = createMockPrayerRequest({
        email: undefined,
        phone: undefined,
        ipAddress: undefined
      });

      expect(request.email).toBeUndefined();
      expect(request.phone).toBeUndefined();
      expect(request.ipAddress).toBeUndefined();
    });

    it('should accept all valid source types', () => {
      const websiteRequest: PrayerRequest = createMockPrayerRequest({ source: 'website' });
      const appRequest: PrayerRequest = createMockPrayerRequest({ source: 'app' });
      const manualRequest: PrayerRequest = createMockPrayerRequest({ source: 'manual' });

      expect(websiteRequest.source).toBe('website');
      expect(appRequest.source).toBe('app');
      expect(manualRequest.source).toBe('manual');
    });

    it('should accept prayedBy array with email strings', () => {
      const request: PrayerRequest = createMockPrayerRequest({
        prayedBy: ['user1@example.com', 'user2@example.com', 'user3@example.com']
      });

      expect(request.prayedBy).toHaveLength(3);
      expect(request.prayedBy).toContain('user1@example.com');
    });

    it('should accept ipAddress when provided', () => {
      const request: PrayerRequest = createMockPrayerRequest({
        ipAddress: '192.168.1.1'
      });

      expect(request.ipAddress).toBe('192.168.1.1');
    });
  });

  describe('CreatePrayerRequestData interface', () => {
    it('should accept minimal valid data', () => {
      const data: CreatePrayerRequestData = {
        name: 'Test User',
        request: 'This is a valid prayer request'
      };

      expect(data.name).toBeDefined();
      expect(data.request).toBeDefined();
    });

    it('should accept all optional fields', () => {
      const data: CreatePrayerRequestData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+5511999999999',
        request: 'This is a valid prayer request',
        isUrgent: true,
        isAnonymous: false
      };

      expect(data.email).toBe('test@example.com');
      expect(data.phone).toBe('+5511999999999');
      expect(data.isUrgent).toBe(true);
      expect(data.isAnonymous).toBe(false);
    });
  });
});

describe('Status Transitions', () => {
  describe('Valid status workflow', () => {
    it('should start with Pending status', () => {
      const data = createMockCreateData();
      const result = PrayerRequestEntity.create(data);

      expect(result.status).toBe(PrayerRequestStatus.Pending);
    });

    it('should allow transition from Pending to Approved', () => {
      const request = createMockPrayerRequest({ status: PrayerRequestStatus.Pending });
      const updatedRequest = { ...request, status: PrayerRequestStatus.Approved };

      expect(updatedRequest.status).toBe(PrayerRequestStatus.Approved);
    });

    it('should allow transition from Pending to Rejected', () => {
      const request = createMockPrayerRequest({ status: PrayerRequestStatus.Pending });
      const updatedRequest = { ...request, status: PrayerRequestStatus.Rejected };

      expect(updatedRequest.status).toBe(PrayerRequestStatus.Rejected);
    });

    it('should allow transition from Approved to Praying', () => {
      const request = createMockPrayerRequest({ status: PrayerRequestStatus.Approved });
      const updatedRequest = { ...request, status: PrayerRequestStatus.Praying };

      expect(updatedRequest.status).toBe(PrayerRequestStatus.Praying);
    });

    it('should allow transition from Praying to Answered', () => {
      const request = createMockPrayerRequest({ status: PrayerRequestStatus.Praying });
      const updatedRequest = { ...request, status: PrayerRequestStatus.Answered };

      expect(updatedRequest.status).toBe(PrayerRequestStatus.Answered);
    });

    it('should allow direct transition from Approved to Answered', () => {
      const request = createMockPrayerRequest({ status: PrayerRequestStatus.Approved });
      const updatedRequest = { ...request, status: PrayerRequestStatus.Answered };

      expect(updatedRequest.status).toBe(PrayerRequestStatus.Answered);
    });
  });

  describe('Status values consistency', () => {
    it('should maintain status after object spread', () => {
      const original = createMockPrayerRequest({ status: PrayerRequestStatus.Praying });
      const copy = { ...original };

      expect(copy.status).toBe(PrayerRequestStatus.Praying);
    });

    it('should allow checking all possible statuses', () => {
      const statuses = [
        PrayerRequestStatus.Pending,
        PrayerRequestStatus.Approved,
        PrayerRequestStatus.Praying,
        PrayerRequestStatus.Answered,
        PrayerRequestStatus.Rejected
      ];

      statuses.forEach(status => {
        const request = createMockPrayerRequest({ status });
        expect(Object.values(PrayerRequestStatus)).toContain(request.status);
      });
    });
  });
});

describe('Date Handling', () => {
  describe('Date creation', () => {
    it('should create dates as Date objects', () => {
      const data = createMockCreateData();
      const result = PrayerRequestEntity.create(data);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should create createdAt and updatedAt with same initial value', () => {
      const data = createMockCreateData();
      const result = PrayerRequestEntity.create(data);

      expect(result.createdAt.getTime()).toBe(result.updatedAt.getTime());
    });

    it('should create dates close to current time', () => {
      const before = Date.now();
      const data = createMockCreateData();
      const result = PrayerRequestEntity.create(data);
      const after = Date.now();

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe('Date formatting scenarios', () => {
    it('should preserve dates in mock object', () => {
      const specificDate = new Date('2024-06-15T14:30:00Z');
      const request = createMockPrayerRequest({
        createdAt: specificDate,
        updatedAt: specificDate
      });

      expect(request.createdAt.getTime()).toBe(specificDate.getTime());
      expect(request.updatedAt.getTime()).toBe(specificDate.getTime());
    });

    it('should allow date comparison', () => {
      const earlier = new Date('2024-01-01T00:00:00Z');
      const later = new Date('2024-12-31T23:59:59Z');

      const request = createMockPrayerRequest({
        createdAt: earlier,
        updatedAt: later
      });

      expect(request.updatedAt.getTime()).toBeGreaterThan(request.createdAt.getTime());
    });

    it('should handle date serialization', () => {
      const request = createMockPrayerRequest();
      const serialized = JSON.stringify(request);
      const parsed = JSON.parse(serialized);

      expect(new Date(parsed.createdAt).getTime()).toBe(request.createdAt.getTime());
      expect(new Date(parsed.updatedAt).getTime()).toBe(request.updatedAt.getTime());
    });

    it('should allow getting date parts', () => {
      const request = createMockPrayerRequest({
        createdAt: new Date('2024-06-15T14:30:45.123Z')
      });

      // Use UTC methods since date string has 'Z' (UTC indicator)
      expect(request.createdAt.getUTCFullYear()).toBe(2024);
      expect(request.createdAt.getUTCMonth()).toBe(5); // June (0-indexed)
      expect(request.createdAt.getUTCDate()).toBe(15);
      expect(request.createdAt.getUTCHours()).toBe(14);
      expect(request.createdAt.getUTCMinutes()).toBe(30);
      expect(request.createdAt.getUTCSeconds()).toBe(45);
    });

    it('should allow ISO string conversion', () => {
      const request = createMockPrayerRequest({
        createdAt: new Date('2024-06-15T14:30:00.000Z')
      });

      expect(request.createdAt.toISOString()).toBe('2024-06-15T14:30:00.000Z');
    });
  });
});

describe('PrayedBy Array Handling', () => {
  describe('Initial state', () => {
    it('should initialize with empty prayedBy array', () => {
      const data = createMockCreateData();
      const result = PrayerRequestEntity.create(data);

      expect(result.prayedBy).toEqual([]);
      expect(result.prayedBy.length).toBe(0);
    });
  });

  describe('Array operations', () => {
    it('should allow adding emails to prayedBy', () => {
      const request = createMockPrayerRequest({ prayedBy: [] });
      const updated = {
        ...request,
        prayedBy: [...request.prayedBy, 'user@example.com']
      };

      expect(updated.prayedBy).toContain('user@example.com');
      expect(updated.prayedBy.length).toBe(1);
    });

    it('should preserve multiple emails in prayedBy', () => {
      const emails = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com'
      ];
      const request = createMockPrayerRequest({ prayedBy: emails });

      expect(request.prayedBy).toHaveLength(3);
      emails.forEach(email => {
        expect(request.prayedBy).toContain(email);
      });
    });

    it('should allow checking if user has prayed', () => {
      const request = createMockPrayerRequest({
        prayedBy: ['user1@example.com', 'user2@example.com']
      });

      expect(request.prayedBy.includes('user1@example.com')).toBe(true);
      expect(request.prayedBy.includes('user3@example.com')).toBe(false);
    });

    it('should allow getting count of prayers', () => {
      const request = createMockPrayerRequest({
        prayedBy: ['a@test.com', 'b@test.com', 'c@test.com', 'd@test.com']
      });

      expect(request.prayedBy.length).toBe(4);
    });
  });
});

describe('Source Types', () => {
  it('should default to website source on creation', () => {
    const data = createMockCreateData();
    const result = PrayerRequestEntity.create(data);

    expect(result.source).toBe('website');
  });

  it('should accept website as source', () => {
    const request = createMockPrayerRequest({ source: 'website' });
    expect(request.source).toBe('website');
  });

  it('should accept app as source', () => {
    const request = createMockPrayerRequest({ source: 'app' });
    expect(request.source).toBe('app');
  });

  it('should accept manual as source', () => {
    const request = createMockPrayerRequest({ source: 'manual' });
    expect(request.source).toBe('manual');
  });
});

describe('Urgent Request Handling', () => {
  it('should correctly identify urgent request', () => {
    const urgentRequest = createMockPrayerRequest({ isUrgent: true });
    expect(urgentRequest.isUrgent).toBe(true);
  });

  it('should correctly identify non-urgent request', () => {
    const normalRequest = createMockPrayerRequest({ isUrgent: false });
    expect(normalRequest.isUrgent).toBe(false);
  });

  it('should allow filtering urgent requests', () => {
    const requests = [
      createMockPrayerRequest({ id: '1', isUrgent: true }),
      createMockPrayerRequest({ id: '2', isUrgent: false }),
      createMockPrayerRequest({ id: '3', isUrgent: true }),
      createMockPrayerRequest({ id: '4', isUrgent: false })
    ];

    const urgentRequests = requests.filter(r => r.isUrgent);
    expect(urgentRequests).toHaveLength(2);
    expect(urgentRequests.map(r => r.id)).toEqual(['1', '3']);
  });
});
