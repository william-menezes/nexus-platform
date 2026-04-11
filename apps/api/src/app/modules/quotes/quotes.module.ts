import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteEntity } from './entities/quote.entity';
import { QuoteItemEntity } from './entities/quote-item.entity';
import { SoItemEntity } from './entities/so-item.entity';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [TypeOrmModule.forFeature([QuoteEntity, QuoteItemEntity, SoItemEntity]), PdfModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
