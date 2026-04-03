import { describe, it, expect, vi } from 'vitest';
import { adminLogsController } from '../modules/admin/admin.logs.controller';
import type { Request, Response, NextFunction } from 'express';

describe('AdminLogsController - Schema Validation', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction = vi.fn();

  beforeEach(() => {
    mockRequest = {
      query: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('getLogs', () => {
    it('should call next with error when nivel is invalid', async () => {
      mockRequest.query = {
        nivel: 'invalid', // Not in ['error', 'warn', 'info', 'debug']
        page: '1',
        limit: '10',
      };

      await adminLogsController.getLogs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next with error when page is not a number', async () => {
      mockRequest.query = {
        page: 'not-a-number',
        limit: '10',
      };

      await adminLogsController.getLogs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next with error when limit is not a number', async () => {
      mockRequest.query = {
        page: '1',
        limit: 'not-a-number',
      };

      await adminLogsController.getLogs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should process valid query parameters without throwing', async () => {
      mockRequest.query = {
        nivel: 'error',
        page: '1',
        limit: '10',
      };

      // Mock file system to return empty results to avoid complex mocking
      vi.spyOn(require('fs'), 'existsSync').mockReturnValue(false);

      await adminLogsController.getLogs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should return empty JSON response, not call next with error
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          logs: [],
          total: 0,
          page: 1,
          totalPages: 0,
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('downloadLog', () => {
    it('should call next with error when filename contains invalid characters', async () => {
      mockRequest.params = {
        filename: '../../etc/passwd', // Invalid path
      };

      await adminLogsController.downloadLog(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should process valid filename without throwing (when file does not exist)', async () => {
      mockRequest.params = {
        filename: 'test.log',
      };

      // Mock file system to return that file doesn't exist
      vi.spyOn(require('fs'), 'existsSync').mockReturnValue(false);

      await adminLogsController.downloadLog(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should return 404 JSON, not call next with validation error
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Archivo no encontrado'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});