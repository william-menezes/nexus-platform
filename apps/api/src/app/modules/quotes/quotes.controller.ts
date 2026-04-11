import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto, RejectQuoteDto } from './dto/update-quote.dto';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';
import { RequirePermission } from '../../core/decorators/permission.decorator';
import { CurrentTenant } from '../../core/decorators/tenant.decorator';
import { PdfService } from '../pdf/pdf.service';
import { QuotePdfData } from '../pdf/pdf.interfaces';

@UseGuards(AuthGuard, PermissionGuard)
@Controller('quotes')
export class QuotesController {
  constructor(
    private readonly service: QuotesService,
    private readonly pdf: PdfService,
  ) {}

  @Get()
  @RequirePermission('quotes:read')
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('statusId') statusId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.service.findAll(tenantId, statusId, clientId);
  }

  @Get(':id')
  @RequirePermission('quotes:read')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @RequirePermission('quotes:create')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateQuoteDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermission('quotes:update')
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: UpdateQuoteDto) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('quotes:delete')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.remove(tenantId, id);
  }

  @Post(':id/send')
  @RequirePermission('quotes:send')
  send(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.send(tenantId, id);
  }

  @Post(':id/approve')
  @RequirePermission('quotes:approve')
  approve(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.approve(tenantId, id);
  }

  @Post(':id/reject')
  @RequirePermission('quotes:approve')
  reject(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: RejectQuoteDto) {
    return this.service.reject(tenantId, id, dto);
  }

  @Post(':id/convert-to-os')
  @RequirePermission('quotes:approve')
  convertToOs(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.convertToOs(tenantId, id);
  }

  @Get(':id/pdf')
  @RequirePermission('quotes:read')
  async getPdf(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const data = await this.service.buildPdfData(tenantId, id);
    const buffer = await this.pdf.generateQuotePdf(data);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${data.code}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
