import { describe, it, expect } from 'vitest';
import {
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema,
  getAvailableSlotsSchema,
  getBookingsQuerySchema,
} from './booking.schema';

describe('createBookingSchema', () => {
  const validCuid = 'clxxxxxxxxxxxxxxxxxx';

  it('should validate a valid booking', () => {
    const validBooking = {
      professionalId: validCuid,
      serviceIds: [validCuid],
      startTime: new Date('2024-03-15T10:00:00Z'),
    };

    const result = createBookingSchema.safeParse(validBooking);
    expect(result.success).toBe(true);
  });

  it('should accept string date and coerce to Date', () => {
    const bookingWithStringDate = {
      professionalId: validCuid,
      serviceIds: [validCuid],
      startTime: '2024-03-15T10:00:00Z',
    };

    const result = createBookingSchema.safeParse(bookingWithStringDate);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startTime).toBeInstanceOf(Date);
    }
  });

  it('should reject booking without services', () => {
    const noServices = {
      professionalId: validCuid,
      serviceIds: [],
      startTime: new Date(),
    };

    const result = createBookingSchema.safeParse(noServices);
    expect(result.success).toBe(false);
  });

  it('should reject invalid professional ID', () => {
    const invalidProfessional = {
      professionalId: 'invalid-id',
      serviceIds: [validCuid],
      startTime: new Date(),
    };

    const result = createBookingSchema.safeParse(invalidProfessional);
    expect(result.success).toBe(false);
  });

  it('should accept multiple services', () => {
    const multipleServices = {
      professionalId: validCuid,
      serviceIds: [validCuid, 'clyyyyyyyyyyyyyyyyy', 'clzzzzzzzzzzzzzzzzzz'],
      startTime: new Date(),
    };

    const result = createBookingSchema.safeParse(multipleServices);
    expect(result.success).toBe(true);
  });

  it('should accept optional client notes', () => {
    const withNotes = {
      professionalId: validCuid,
      serviceIds: [validCuid],
      startTime: new Date(),
      clientNotes: 'Je préfère un coiffeur homme',
    };

    const result = createBookingSchema.safeParse(withNotes);
    expect(result.success).toBe(true);
  });

  it('should reject notes over 500 characters', () => {
    const tooLongNotes = {
      professionalId: validCuid,
      serviceIds: [validCuid],
      startTime: new Date(),
      clientNotes: 'a'.repeat(501),
    };

    const result = createBookingSchema.safeParse(tooLongNotes);
    expect(result.success).toBe(false);
  });
});

describe('updateBookingSchema', () => {
  const validCuid = 'clxxxxxxxxxxxxxxxxxx';

  it('should require booking ID', () => {
    const noId = {
      startTime: new Date(),
    };

    const result = updateBookingSchema.safeParse(noId);
    expect(result.success).toBe(false);
  });

  it('should allow updating start time', () => {
    const updateTime = {
      id: validCuid,
      startTime: new Date('2024-03-16T14:00:00Z'),
    };

    const result = updateBookingSchema.safeParse(updateTime);
    expect(result.success).toBe(true);
  });

  it('should allow updating notes', () => {
    const updateNotes = {
      id: validCuid,
      clientNotes: 'Updated notes',
    };

    const result = updateBookingSchema.safeParse(updateNotes);
    expect(result.success).toBe(true);
  });
});

describe('cancelBookingSchema', () => {
  const validCuid = 'clxxxxxxxxxxxxxxxxxx';

  it('should require booking ID', () => {
    const noId = {
      reason: 'Changed my mind',
    };

    const result = cancelBookingSchema.safeParse(noId);
    expect(result.success).toBe(false);
  });

  it('should accept cancellation with reason', () => {
    const withReason = {
      id: validCuid,
      reason: 'I have an emergency',
    };

    const result = cancelBookingSchema.safeParse(withReason);
    expect(result.success).toBe(true);
  });

  it('should accept cancellation without reason', () => {
    const withoutReason = {
      id: validCuid,
    };

    const result = cancelBookingSchema.safeParse(withoutReason);
    expect(result.success).toBe(true);
  });
});

describe('getAvailableSlotsSchema', () => {
  const validCuid = 'clxxxxxxxxxxxxxxxxxx';

  it('should validate valid request', () => {
    const valid = {
      professionalId: validCuid,
      serviceIds: [validCuid],
      date: new Date('2024-03-15'),
    };

    const result = getAvailableSlotsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should reject request without services', () => {
    const noServices = {
      professionalId: validCuid,
      serviceIds: [],
      date: new Date(),
    };

    const result = getAvailableSlotsSchema.safeParse(noServices);
    expect(result.success).toBe(false);
  });
});

describe('getBookingsQuerySchema', () => {
  it('should accept empty query', () => {
    const result = getBookingsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept valid status', () => {
    const upcoming = { status: 'upcoming' };
    const past = { status: 'past' };
    const all = { status: 'all' };

    expect(getBookingsQuerySchema.safeParse(upcoming).success).toBe(true);
    expect(getBookingsQuerySchema.safeParse(past).success).toBe(true);
    expect(getBookingsQuerySchema.safeParse(all).success).toBe(true);
  });

  it('should reject invalid status', () => {
    const invalid = { status: 'invalid' };
    const result = getBookingsQuerySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should use default limit', () => {
    const result = getBookingsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it('should reject limit over 100', () => {
    const tooHigh = { limit: 150 };
    const result = getBookingsQuerySchema.safeParse(tooHigh);
    expect(result.success).toBe(false);
  });
});
