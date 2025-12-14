import { validatePort } from './validation.utils';

describe('Validation Utils', () => {
  describe('validatePort', () => {
    it('should validate a valid port number as string', () => {
      expect(validatePort('8080')).toBe(8080);
      expect(validatePort('3000')).toBe(3000);
      expect(validatePort('5432')).toBe(5432);
    });

    it('should validate a valid port number', () => {
      expect(validatePort(8080)).toBe(8080);
      expect(validatePort(3000)).toBe(3000);
      expect(validatePort(5432)).toBe(5432);
    });

    it('should validate minimum port (1)', () => {
      expect(validatePort('1')).toBe(1);
      expect(validatePort(1)).toBe(1);
    });

    it('should validate maximum port (65535)', () => {
      expect(validatePort('65535')).toBe(65535);
      expect(validatePort(65535)).toBe(65535);
    });

    it('should throw error for non-numeric string', () => {
      expect(() => validatePort('abc')).toThrow(
        'Invalid PORT: must be a numeric value',
      );
      expect(() => validatePort('')).toThrow(
        'Invalid PORT: must be a numeric value',
      );
    });

    it('should accept decimal strings and truncate to integer', () => {
      // parseInt('12.5') returns 12, which is valid behavior
      expect(validatePort('12.5')).toBe(12);
      expect(validatePort('8080.9')).toBe(8080);
    });

    it('should throw error for port below minimum (0)', () => {
      expect(() => validatePort('0')).toThrow(
        'Invalid PORT: must be between 1 and 65535',
      );
      expect(() => validatePort(0)).toThrow(
        'Invalid PORT: must be between 1 and 65535',
      );
      expect(() => validatePort('-1')).toThrow(
        'Invalid PORT: must be between 1 and 65535',
      );
    });

    it('should throw error for port above maximum (65536)', () => {
      expect(() => validatePort('65536')).toThrow(
        'Invalid PORT: must be between 1 and 65535',
      );
      expect(() => validatePort(65536)).toThrow(
        'Invalid PORT: must be between 1 and 65535',
      );
      expect(() => validatePort('100000')).toThrow(
        'Invalid PORT: must be between 1 and 65535',
      );
    });

    it('should use custom field name in error messages', () => {
      expect(() => validatePort('abc', 'DB_PORT')).toThrow(
        'Invalid DB_PORT: must be a numeric value',
      );
      expect(() => validatePort('0', 'SMTP_PORT')).toThrow(
        'Invalid SMTP_PORT: must be between 1 and 65535',
      );
    });

    it('should handle NaN values', () => {
      expect(() => validatePort(NaN)).toThrow(
        'Invalid PORT: must be a numeric value',
      );
    });
  });
});
