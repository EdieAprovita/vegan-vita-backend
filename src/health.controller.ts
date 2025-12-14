import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Checks the server status',
  })
  @ApiResponse({
    status: 200,
    description: 'Server is running correctly',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2025-12-14T10:00:00.000Z',
      },
    },
  })
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
