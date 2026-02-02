import { describe, it, expect } from 'vitest';
import {
  createServiceSchema,
  updateServiceSchema,
  getServicesBySalonSchema,
} from './service.schema';

describe('createServiceSchema', () => {
  const validCuid = 'clxxxxxxxxxxxxxxxxxx';

  it('should validate a valid service', () => {
    const validService = {
      salonId: validCuid,
      name: 'Coupe homme',
      category: 'Coiffure',
      price: 2500, // 25.00 € in cents
      durationMinutes: 30,
    };

    const result = createServiceSchema.safeParse(validService);
    expect(result.success).toBe(true);
  });

  it('should reject service without salon ID', () => {
    const noSalon = {
      name: 'Coupe homme',
      category: 'Coiffure',
      price: 2500,
      durationMinutes: 30,
    };

    const result = createServiceSchema.safeParse(noSalon);
    expect(result.success).toBe(false);
  });

  it('should reject invalid price (negative)', () => {
    const negativePrice = {
      salonId: validCuid,
      name: 'Coupe homme',
      category: 'Coiffure',
      price: -100,
      durationMinutes: 30,
    };

    const result = createServiceSchema.safeParse(negativePrice);
    expect(result.success).toBe(false);
  });

  it('should reject price with decimals', () => {
    const decimalPrice = {
      salonId: validCuid,
      name: 'Coupe homme',
      category: 'Coiffure',
      price: 25.50, // Should be in cents (integer)
      durationMinutes: 30,
    };

    const result = createServiceSchema.safeParse(decimalPrice);
    expect(result.success).toBe(false);
  });

  it('should reject duration under 15 minutes', () => {
    const tooShort = {
      salonId: validCuid,
      name: 'Quick service',
      category: 'Coiffure',
      price: 1000,
      durationMinutes: 10,
    };

    const result = createServiceSchema.safeParse(tooShort);
    expect(result.success).toBe(false);
  });

  it('should reject duration over 8 hours', () => {
    const tooLong = {
      salonId: validCuid,
      name: 'Very long service',
      category: 'Spa',
      price: 50000,
      durationMinutes: 500, // Over 8 hours (480 min)
    };

    const result = createServiceSchema.safeParse(tooLong);
    expect(result.success).toBe(false);
  });

  it('should accept optional description', () => {
    const withDescription = {
      salonId: validCuid,
      name: 'Coupe homme',
      description: 'Coupe classique avec shampoing',
      category: 'Coiffure',
      price: 2500,
      durationMinutes: 30,
    };

    const result = createServiceSchema.safeParse(withDescription);
    expect(result.success).toBe(true);
  });

  it('should use EUR as default currency', () => {
    const service = {
      salonId: validCuid,
      name: 'Coupe homme',
      category: 'Coiffure',
      price: 2500,
      durationMinutes: 30,
    };

    const result = createServiceSchema.safeParse(service);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('EUR');
    }
  });

  it('should reject invalid image URL', () => {
    const invalidImage = {
      salonId: validCuid,
      name: 'Coupe homme',
      category: 'Coiffure',
      price: 2500,
      durationMinutes: 30,
      image: 'not-a-url',
    };

    const result = createServiceSchema.safeParse(invalidImage);
    expect(result.success).toBe(false);
  });

  it('should accept valid image URL', () => {
    const withImage = {
      salonId: validCuid,
      name: 'Coupe homme',
      category: 'Coiffure',
      price: 2500,
      durationMinutes: 30,
      image: 'https://example.com/image.jpg',
    };

    const result = createServiceSchema.safeParse(withImage);
    expect(result.success).toBe(true);
  });
});

describe('updateServiceSchema', () => {
  const validCuid = 'clxxxxxxxxxxxxxxxxxx';

  it('should require service ID', () => {
    const noId = {
      name: 'Updated name',
    };

    const result = updateServiceSchema.safeParse(noId);
    expect(result.success).toBe(false);
  });

  it('should allow partial updates', () => {
    const partialUpdate = {
      id: validCuid,
      price: 3000,
    };

    const result = updateServiceSchema.safeParse(partialUpdate);
    expect(result.success).toBe(true);
  });

  it('should allow updating name only', () => {
    const nameUpdate = {
      id: validCuid,
      name: 'Coupe femme',
    };

    const result = updateServiceSchema.safeParse(nameUpdate);
    expect(result.success).toBe(true);
  });

  it('should allow updating duration only', () => {
    const durationUpdate = {
      id: validCuid,
      durationMinutes: 45,
    };

    const result = updateServiceSchema.safeParse(durationUpdate);
    expect(result.success).toBe(true);
  });
});

describe('getServicesBySalonSchema', () => {
  const validCuid = 'clxxxxxxxxxxxxxxxxxx';

  it('should validate valid request', () => {
    const valid = {
      salonId: validCuid,
    };

    const result = getServicesBySalonSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should accept optional category filter', () => {
    const withCategory = {
      salonId: validCuid,
      category: 'Coiffure',
    };

    const result = getServicesBySalonSchema.safeParse(withCategory);
    expect(result.success).toBe(true);
  });

  it('should accept optional active filter', () => {
    const withActive = {
      salonId: validCuid,
      active: true,
    };

    const result = getServicesBySalonSchema.safeParse(withActive);
    expect(result.success).toBe(true);
  });

  it('should reject invalid salon ID', () => {
    const invalidId = {
      salonId: 'invalid',
    };

    const result = getServicesBySalonSchema.safeParse(invalidId);
    expect(result.success).toBe(false);
  });
});
