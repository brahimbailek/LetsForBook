import { describe, it, expect } from 'vitest';
import { createSalonSchema, updateSalonSchema, searchSalonsSchema } from './salon.schema';

describe('createSalonSchema', () => {
  it('should validate a valid salon', () => {
    const validSalon = {
      name: 'Mon Salon',
      email: 'contact@monsalon.fr',
      phone: '0123456789',
      address: '123 Rue de Paris',
      city: 'Paris',
      postalCode: '75001',
    };

    const result = createSalonSchema.safeParse(validSalon);
    expect(result.success).toBe(true);
  });

  it('should reject a salon without name', () => {
    const invalidSalon = {
      email: 'contact@monsalon.fr',
      phone: '0123456789',
      address: '123 Rue de Paris',
      city: 'Paris',
      postalCode: '75001',
    };

    const result = createSalonSchema.safeParse(invalidSalon);
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const invalidSalon = {
      name: 'Mon Salon',
      email: 'invalid-email',
      phone: '0123456789',
      address: '123 Rue de Paris',
      city: 'Paris',
      postalCode: '75001',
    };

    const result = createSalonSchema.safeParse(invalidSalon);
    expect(result.success).toBe(false);
  });

  it('should accept optional slug', () => {
    const salonWithSlug = {
      name: 'Mon Salon',
      slug: 'mon-salon',
      email: 'contact@monsalon.fr',
      phone: '0123456789',
      address: '123 Rue de Paris',
      city: 'Paris',
      postalCode: '75001',
    };

    const result = createSalonSchema.safeParse(salonWithSlug);
    expect(result.success).toBe(true);
  });

  it('should reject invalid slug format', () => {
    const invalidSlug = {
      name: 'Mon Salon',
      slug: 'Mon Salon With Spaces',
      email: 'contact@monsalon.fr',
      phone: '0123456789',
      address: '123 Rue de Paris',
      city: 'Paris',
      postalCode: '75001',
    };

    const result = createSalonSchema.safeParse(invalidSlug);
    expect(result.success).toBe(false);
  });

  it('should validate deposit settings', () => {
    const salonWithDeposit = {
      name: 'Mon Salon',
      email: 'contact@monsalon.fr',
      phone: '0123456789',
      address: '123 Rue de Paris',
      city: 'Paris',
      postalCode: '75001',
      depositRequired: true,
      depositPercentage: 25,
    };

    const result = createSalonSchema.safeParse(salonWithDeposit);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.depositRequired).toBe(true);
      expect(result.data.depositPercentage).toBe(25);
    }
  });

  it('should reject deposit percentage over 100', () => {
    const invalidDeposit = {
      name: 'Mon Salon',
      email: 'contact@monsalon.fr',
      phone: '0123456789',
      address: '123 Rue de Paris',
      city: 'Paris',
      postalCode: '75001',
      depositRequired: true,
      depositPercentage: 150,
    };

    const result = createSalonSchema.safeParse(invalidDeposit);
    expect(result.success).toBe(false);
  });

  it('should use default values', () => {
    const minimalSalon = {
      name: 'Mon Salon',
      email: 'contact@monsalon.fr',
      phone: '0123456789',
      address: '123 Rue de Paris',
      city: 'Paris',
      postalCode: '75001',
    };

    const result = createSalonSchema.safeParse(minimalSalon);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.country).toBe('FR');
      expect(result.data.timezone).toBe('Europe/Paris');
      expect(result.data.currency).toBe('EUR');
      expect(result.data.depositRequired).toBe(false);
    }
  });
});

describe('updateSalonSchema', () => {
  it('should require id for update', () => {
    const updateWithoutId = {
      name: 'Updated Salon',
    };

    const result = updateSalonSchema.safeParse(updateWithoutId);
    expect(result.success).toBe(false);
  });

  it('should allow partial updates', () => {
    const partialUpdate = {
      id: 'clxxxxxxxxxxxxxxxxxx',
      name: 'Updated Salon',
    };

    const result = updateSalonSchema.safeParse(partialUpdate);
    expect(result.success).toBe(true);
  });

  it('should allow updating only deposit settings', () => {
    const depositUpdate = {
      id: 'clxxxxxxxxxxxxxxxxxx',
      depositRequired: true,
      depositPercentage: 50,
    };

    const result = updateSalonSchema.safeParse(depositUpdate);
    expect(result.success).toBe(true);
  });
});

describe('searchSalonsSchema', () => {
  it('should accept empty search', () => {
    const result = searchSalonsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept search with query and city', () => {
    const search = {
      query: 'coiffure',
      city: 'Paris',
    };

    const result = searchSalonsSchema.safeParse(search);
    expect(result.success).toBe(true);
  });

  it('should accept location-based search', () => {
    const geoSearch = {
      latitude: 48.8566,
      longitude: 2.3522,
      radius: 10,
    };

    const result = searchSalonsSchema.safeParse(geoSearch);
    expect(result.success).toBe(true);
  });

  it('should use default limit', () => {
    const result = searchSalonsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it('should reject invalid latitude', () => {
    const invalidGeo = {
      latitude: 200,
      longitude: 2.3522,
    };

    const result = searchSalonsSchema.safeParse(invalidGeo);
    expect(result.success).toBe(false);
  });
});
