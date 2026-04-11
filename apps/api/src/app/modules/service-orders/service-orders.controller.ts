import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ServiceOrdersService } from './service-orders.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto, ChangeStatusDto } from './dto/update-service-order.dto';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';
import { CurrentTenant } from '../../core/decorators/tenant.decorator';
import { RequirePermission } from '../../core/decorators/permission.decorator';
import { PdfService } from '../pdf/pdf.service';

@UseGuards(AuthGuard, PermissionGuard)
@Controller('service-orders')
export class ServiceOrdersController {
  constructor(
    private readonly service: ServiceOrdersService,
    private readonly pdf: PdfService,
  ) {}

  @Get()
  @RequirePermission('service_orders:read')
  findAll(@CurrentTenant() tenantId: string) {
    return this.service.findAll(tenantId);
  }

  @Get(':id')
  @RequirePermission('service_orders:read')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @RequirePermission('service_orders:create')
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateServiceOrderDto,
  ) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermission('service_orders:update')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceOrderDto,
  ) {
    return this.service.update(tenantId, id, dto);
  }

  @Patch(':id/status')
  @RequirePermission('service_orders:change_status')
  changeStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.service.changeStatus(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('service_orders:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.remove(tenantId, id);
  }

  @Get(':id/pdf')
  @RequirePermission('service_orders:read')
  async getPdf(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const data = await this.service.buildPdfData(tenantId, id);
    const buffer = await this.pdf.generateServiceOrderPdf(data);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${data.code}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
