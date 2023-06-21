import { Logger, Injectable } from '@nestjs/common';
import UserRoles from 'supertokens-node/recipe/userroles';
@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  async getAllRoles() {
    const roles: string[] = (await UserRoles.getAllRoles()).roles;
    return roles;
  }

  async createDefaultRoles() {
    const freeResponse = await UserRoles.createNewRoleOrAddPermissions('free', [
      'read',
    ]);
    this.logger.log(
      '<free> role created with <read> permision(s)',
      freeResponse,
    );

    const paidResponse = await UserRoles.createNewRoleOrAddPermissions('paid', [
      'read',
      'write',
    ]);

    this.logger.log(
      '<paid> role created with <read, write> permision(s):',
      paidResponse,
    );
  }

  async addRoleToUser(userId: string, role: string) {
    const response = await UserRoles.addRoleToUser(userId, role);
    this.logger.debug(response);
    if (response.status === 'UNKNOWN_ROLE_ERROR') {
      this.logger.warn('No such role exists.');
      return;
    }

    if (response.didUserAlreadyHaveRole === true) {
      this.logger.warn('The user already had the role.');
    }
  }

  async getRolesForUser(userId: string): Promise<string[]> {
    const response = await UserRoles.getRolesForUser(userId);
    const roles: string[] = response.roles;
    return roles;
  }
}
