import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PERMISSION_KEY } from '../decorators/permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const role: string | undefined = request['userRole'];
    const tenantId: string | undefined = request['tenantId'];

    if (!role || !tenantId) {
      throw new ForbiddenException('Papel ou tenant não identificado');
    }

    // SUPER_ADMIN and TENANT_ADMIN have full access
    if (role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN') return true;

    const [module, action] = required.split(':');

    const rows = await this.dataSource.query<{ actions: string[] }[]>(
      `SELECT actions FROM public.permissions
       WHERE tenant_id = $1 AND role = $2 AND module = $3
       LIMIT 1`,
      [tenantId, role, module],
    );

    if (!rows.length || !rows[0].actions.includes(action)) {
      throw new ForbiddenException('Permissão insuficiente');
    }

    return true;
  }
}
