import {
  createParamDecorator,
  ExecutionContext
} from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    return ctx.switchToHttp().getRequest()['tenantId'];
  },
);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): any => {
    return ctx.switchToHttp().getRequest()['user'];
  },
);
