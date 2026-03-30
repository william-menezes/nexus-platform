import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method as string;

    // Only audit mutations
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const tenantId: string | undefined = request['tenantId'];
    const user = request['user'];
    const action = this.mapAction(method);
    const entity = this.extractEntity(request.route?.path || request.url);
    const entityId: string | undefined = request.params?.id;
    const ip = request.ip || request.headers['x-forwarded-for'];
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap((responseBody) => {
        if (!tenantId || !user) return;

        this.dataSource.query(
          `INSERT INTO public.audit_logs
           (tenant_id, user_id, action, entity, entity_id, new_data, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            tenantId,
            user.id,
            action,
            entity,
            entityId || responseBody?.id || null,
            method !== 'DELETE' ? JSON.stringify(responseBody) : null,
            ip,
            userAgent,
          ],
        ).catch(() => { /* audit failure must not break the request */ });
      }),
    );
  }

  private mapAction(method: string): string {
    switch (method) {
      case 'POST': return 'create';
      case 'PATCH':
      case 'PUT': return 'update';
      case 'DELETE': return 'delete';
      default: return method.toLowerCase();
    }
  }

  private extractEntity(path: string): string {
    // "/api/clients/123" → "clients"
    const segments = path.replace(/^\/api\//, '').split('/');
    return segments[0] || 'unknown';
  }
}
