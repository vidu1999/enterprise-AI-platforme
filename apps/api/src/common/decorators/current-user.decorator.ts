import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export interface AuthUser { id: string; email: string; role: string; companyId: string; }
export const CurrentUser = createParamDecorator((_data, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.user as AuthUser;
});
