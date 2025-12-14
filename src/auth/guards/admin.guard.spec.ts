import { AdminGuard } from './admin.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let mockExecutionContext: Partial<ExecutionContext>;
  let mockRequest: any;

  beforeEach(() => {
    guard = new AdminGuard();
    mockRequest = {};
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access when user is admin', () => {
      mockRequest.user = {
        id: '1',
        email: 'admin@example.com',
        isAdmin: true,
      };

      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
    });

    it('should deny access when user is not admin', () => {
      mockRequest.user = {
        id: '2',
        email: 'user@example.com',
        isAdmin: false,
      };

      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow(ForbiddenException);
      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow('Access denied: administrator permissions required');
    });

    it('should deny access when user does not exist', () => {
      mockRequest.user = null;

      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow(ForbiddenException);
      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow('Access denied: administrator permissions required');
    });

    it('should deny access when user object is undefined', () => {
      mockRequest.user = undefined;

      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow(ForbiddenException);
    });

    it('should deny access when isAdmin is explicitly false', () => {
      mockRequest.user = {
        id: '3',
        email: 'user@example.com',
        isAdmin: false,
      };

      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow(ForbiddenException);
    });
  });
});
