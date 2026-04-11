import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const role: string | undefined = request['userRole'];

    if (role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Acesso restrito a SUPER_ADMIN');
    }

    return true;
  }
}
