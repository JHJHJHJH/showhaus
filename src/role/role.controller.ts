import { Controller, Get, UseInterceptors, Param } from '@nestjs/common';
import { RoleService } from './role.service';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';
import { ResponseMessage } from 'src/decorators/message.decorator';
@Controller('role')
export class RoleController {
  constructor(private roleService: RoleService) {}

  @Get('all')
  @ResponseMessage('Success')
  @UseInterceptors(TransformInterceptor)
  async getAllRoles(): Promise<string[]> {
    return this.roleService.getAllRoles();
  }
  @Get('/:id')
  @ResponseMessage('Success')
  @UseInterceptors(TransformInterceptor)
  async getUserRoles(@Param('id') userId): Promise<string[]> {
    return this.roleService.getRolesForUser(userId);
  }
}
