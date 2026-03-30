import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InventoryService } from './inventory.service';
import { NfeImportService } from './nfe-import.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import { AuthGuard } from '../../core/guards/auth.guard';
import { CurrentTenant } from '../../core/decorators/tenant.decorator';

@UseGuards(AuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly svc: InventoryService,
    private readonly nfeImport: NfeImportService,
  ) {}

  // ── Produtos ──────────────────────────────────────────────

  @Get('products')
  findAllProducts(@CurrentTenant() tenantId: string) {
    return this.svc.findAllProducts(tenantId);
  }

  @Get('products/:id')
  findOneProduct(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.findOneProduct(tenantId, id);
  }

  @Post('products')
  createProduct(@CurrentTenant() tenantId: string, @Body() dto: CreateProductDto) {
    return this.svc.createProduct(tenantId, dto);
  }

  @Patch('products/:id')
  updateProduct(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.svc.updateProduct(tenantId, id, dto);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeProduct(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.removeProduct(tenantId, id);
  }

  // ── Movimentações ─────────────────────────────────────────

  @Get('products/:id/entries')
  findEntries(@CurrentTenant() tenantId: string, @Param('id') productId: string) {
    return this.svc.findEntries(tenantId, productId);
  }

  @Post('entries')
  createEntry(@CurrentTenant() tenantId: string, @Body() dto: CreateStockEntryDto) {
    return this.svc.createEntry(tenantId, dto);
  }

  // ── NF-e Import ───────────────────────────────────────────

  @Post('nfe-import')
  @UseInterceptors(FileInterceptor('file'))
  async nfeImportFile(
    @CurrentTenant() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { error: 'Arquivo XML não enviado.' };
    }
    return this.nfeImport.importXml(tenantId, file.buffer.toString('utf-8'));
  }
}
