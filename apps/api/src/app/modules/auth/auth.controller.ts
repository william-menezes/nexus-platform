import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../core/guards/auth.guard';
import { AuthService, OnboardingDto } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** POST /api/auth/onboarding — cria tenant + semeia defaults para um novo usuário */
  @Post('onboarding')
  @UseGuards(AuthGuard)
  onboarding(@Req() req: any, @Body() dto: OnboardingDto) {
    const userId: string = req['user'];
    return this.authService.onboarding(userId, dto);
  }

  /** GET /api/auth/me — retorna dados do usuário autenticado */
  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() req: any) {
    return {
      userId: req['user'],
      tenantId: req['tenantId'] ?? null,
      role: req['userRole'] ?? null,
    };
  }
}
