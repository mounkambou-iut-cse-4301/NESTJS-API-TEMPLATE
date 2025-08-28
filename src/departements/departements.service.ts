import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';

@Injectable()
export class DepartementsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { page: number; pageSize: number; sort?: Record<string,'asc'|'desc'>; q?: string; regionId?: number; code?: string; }) {
    const { page, pageSize, sort, q, regionId, code } = params;
    const where: any = {};
    if (q) {
      where.OR = [
        { nom:    { contains: q, mode: 'insensitive' } },
        { nom_en: { contains: q, mode: 'insensitive' } },
        { code:   { contains: q, mode: 'insensitive' } },
      ];
    }
    if (typeof regionId === 'number') where.regionId = regionId;
    if (code) where.code = code;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.departement.count({ where }),
      this.prisma.departement.findMany({
        where,
        orderBy: sort ?? { nom: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, nom: true, nom_en: true, code: true, regionId: true,
          region: { select: { id: true, nom: true, code: true } },
        },
      }),
    ]);
    return { total, items };
  }

  async create(dto: CreateDepartementDto) {
    await this.ensureRegion(dto.regionId);
    try {
      return await this.prisma.departement.create({
        data: { nom: dto.nom, nom_en: dto.nom_en, code: dto.code, regionId: dto.regionId },
        select: { id: true, nom: true, nom_en: true, code: true, regionId: true },
      });
    } catch (e: any) {
      if (e.code === 'P2002')
        throw new BadRequestException({ message: 'Contrainte d’unicité (code).', messageE: 'Unique constraint (code).' });
      throw e;
    }
  }

  async findOne(id: number) {
    const row = await this.prisma.departement.findUnique({
      where: { id },
      select: {
        id: true, nom: true, nom_en: true, code: true, regionId: true,
        region: { select: { id: true, nom: true, code: true } },
      },
    });
    if (!row)
      throw new NotFoundException({ message: 'Département introuvable.', messageE: 'Department not found.' });
    return row;
  }

  async update(id: number, dto: UpdateDepartementDto) {
    await this.ensureExists(id);
    if (typeof dto.regionId === 'number') await this.ensureRegion(dto.regionId);
    try {
      return await this.prisma.departement.update({
        where: { id }, data: dto,
        select: { id: true, nom: true, nom_en: true, code: true, regionId: true },
      });
    } catch (e: any) {
      if (e.code === 'P2002')
        throw new BadRequestException({ message: 'Contrainte d’unicité (code).', messageE: 'Unique constraint (code).' });
      throw e;
    }
  }

  private async ensureExists(id: number) {
    const ok = await this.prisma.departement.count({ where: { id } });
    if (!ok)
      throw new NotFoundException({ message: 'Département introuvable.', messageE: 'Department not found.' });
  }
  private async ensureRegion(id: number) {
    const ok = await this.prisma.region.count({ where: { id } });
    if (!ok)
      throw new BadRequestException({ message: 'Région inconnue.', messageE: 'Unknown region.' });
  }
}
