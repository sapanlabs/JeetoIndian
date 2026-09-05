import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '@jeeto/shared-types';

@ApiTags('Admin Operations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('api/v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.ANALYST, RoleName.CONTENT_MANAGER, RoleName.MODERATOR)
  @ApiOperation({ summary: 'Get operational dashboard overview metrics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
}
