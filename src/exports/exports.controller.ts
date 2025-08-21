import { Controller, Get, Query, Res, Req, BadRequestException, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportsService, ExportFormat } from './exports.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';


 @ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, NotBlockedGuard) // 👈 tu mets ça seulement ici si tu le veux

@Controller('exports')
export class ExportsController {
  constructor(private readonly svc: ExportsService) {}

  /** /exports/infrastructures?format=csv|pdf */
  @ApiOperation({
      summary: 'api pour export en pdf, csv et xlsx',
    })
  @Get('infrastructures')
  async exportInfrastructures(@Req() req: any, @Query('format') format: ExportFormat = 'csv', @Res() res: Response) {
    const { path, filename, mime } = await this.svc.exportInfrastructures(req, format);
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.sendFile(path);
  }

    @ApiOperation({
      summary: 'api pour export en pdf, csv et xlsx',
    })
  /** /exports/communes?format=csv|pdf */
  @Get('communes')
  async exportCommunes(@Req() req: any, @Query('format') format: ExportFormat = 'csv', @Res() res: Response) {
    const { path, filename, mime } = await this.svc.exportCommunes(req, format);
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.sendFile(path);
  }

    @ApiOperation({
      summary: 'api pour export en pdf, csv et xlsx',
    })
  /** /exports/utilisateurs?format=csv|pdf */
  @Get('utilisateurs')
  async exportUtilisateurs(@Req() req: any, @Query('format') format: ExportFormat = 'csv', @Res() res: Response) {
    const { path, filename, mime } = await this.svc.exportUtilisateurs(req, format);
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.sendFile(path);
  }

    @ApiOperation({
      summary: 'api pour export en pdf, csv et xlsx',
    })
  /** /exports/type-infrastructures?format=csv|pdf */
  @Get('type-infrastructures')
  async exportTypeInfrastructures(@Query('format') format: ExportFormat = 'csv', @Res() res: Response) {
    const { path, filename, mime } = await this.svc.exportTypeInfrastructures(format);
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.sendFile(path);
  }
}
