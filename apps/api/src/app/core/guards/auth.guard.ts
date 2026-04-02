import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AuthGuard implements CanActivate {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY,
  );

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token ausente ou formato inválido');
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException(
        'Token inválido ou usuário não encontrado',
      );
    }

    request['user'] = user.id;

    // Resolve tenant + role here (middleware runs before guards, so user isn't set yet there)
    const rows = await this.dataSource.query<{ tenant_id: string; role: string }[]>(
      `SELECT tenant_id, role FROM public.tenant_users WHERE user_id = $1 LIMIT 1`,
      [user.id],
    );

    if (rows.length) {
      const { tenant_id: tenantId, role } = rows[0];
      request['tenantId'] = tenantId;
      request['userRole'] = role;
      await this.dataSource.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantId]);
    }

    return true;
  }
}
