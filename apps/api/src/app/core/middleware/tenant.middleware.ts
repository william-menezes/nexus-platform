import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any)['user'];

    if (!user) return next();

    const rows = await this.dataSource.query<{ tenant_id: string }[]>(
      `SELECT tenant_id FROM public.tenant_users WHERE user_id = $1 LIMIT 1`,
      [user.id],
    );

    if (!rows.length) {
      throw new ForbiddenException('Usuário não pertence a nenhum tenant');
    }

    const tenantId = rows[0].tenant_id;

    await this.dataSource.query(
      `SELECT set_config('app.current_tenant', $1, true)`,
      [tenantId],
    );

    (req as any)['tenantId'] = tenantId;
    next();
  }
}
