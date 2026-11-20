import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Array<Role | `${Role}`>) => SetMetadata(ROLES_KEY, roles);
