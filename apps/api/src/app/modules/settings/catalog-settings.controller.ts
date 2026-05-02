import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { CatalogSettingsService } from './catalog-settings.service';
import { CreateItemCategoryDto } from './dto/create-item-category.dto';
import { CreateItemBrandDto } from './dto/create-item-brand.dto';
import { CreateItemQualityDto } from './dto/create-item-quality.dto';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';
import { RequirePermission } from '../../core/decorators/permission.decorator';
import { CurrentTenant } from '../../core/decorators/tenant.decorator';
import { ItemCategoryType } from './entities/item-category.entity';
import { ItemBrandType } from './entities/item-brand.entity';
import { ItemQualityType } from './entities/item-quality.entity';

@UseGuards(AuthGuard, PermissionGuard)
@Controller('settings')
export class CatalogSettingsController {
  constructor(private readonly svc: CatalogSettingsService) {}

  // ── Categories ────────────────────────────────────────────

  @Get('item-categories')
  @RequirePermission('settings:read')
  findCategories(
    @CurrentTenant() tenantId: string,
    @Query('itemType') itemType: ItemCategoryType,
  ) {
    return this.svc.findCategories(tenantId, itemType);
  }

  @Post('item-categories')
  @RequirePermission('settings:update')
  createCategory(@CurrentTenant() tenantId: string, @Body() dto: CreateItemCategoryDto) {
    return this.svc.createCategory(tenantId, dto);
  }

  @Patch('item-categories/:id')
  @RequirePermission('settings:update')
  updateCategory(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateItemCategoryDto>,
  ) {
    return this.svc.updateCategory(tenantId, id, dto);
  }

  @Delete('item-categories/:id')
  @RequirePermission('settings:update')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCategory(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.deleteCategory(tenantId, id);
  }

  // ── Brands ────────────────────────────────────────────────

  @Get('item-brands')
  @RequirePermission('settings:read')
  findBrands(
    @CurrentTenant() tenantId: string,
    @Query('itemType') itemType: ItemBrandType,
  ) {
    return this.svc.findBrands(tenantId, itemType);
  }

  @Post('item-brands')
  @RequirePermission('settings:update')
  createBrand(@CurrentTenant() tenantId: string, @Body() dto: CreateItemBrandDto) {
    return this.svc.createBrand(tenantId, dto);
  }

  @Patch('item-brands/:id')
  @RequirePermission('settings:update')
  updateBrand(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateItemBrandDto>,
  ) {
    return this.svc.updateBrand(tenantId, id, dto);
  }

  @Delete('item-brands/:id')
  @RequirePermission('settings:update')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteBrand(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.deleteBrand(tenantId, id);
  }

  // ── Qualities ─────────────────────────────────────────────

  @Get('item-qualities')
  @RequirePermission('settings:read')
  findQualities(
    @CurrentTenant() tenantId: string,
    @Query('itemType') itemType: ItemQualityType,
  ) {
    return this.svc.findQualities(tenantId, itemType);
  }

  @Post('item-qualities')
  @RequirePermission('settings:update')
  createQuality(@CurrentTenant() tenantId: string, @Body() dto: CreateItemQualityDto) {
    return this.svc.createQuality(tenantId, dto);
  }

  @Patch('item-qualities/:id')
  @RequirePermission('settings:update')
  updateQuality(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateItemQualityDto>,
  ) {
    return this.svc.updateQuality(tenantId, id, dto);
  }

  @Delete('item-qualities/:id')
  @RequirePermission('settings:update')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteQuality(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.deleteQuality(tenantId, id);
  }
}
