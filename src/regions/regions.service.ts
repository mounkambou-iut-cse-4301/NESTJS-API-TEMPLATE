import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@Injectable()
export class RegionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { page: number; pageSize: number; sort?: Record<string,'asc'|'desc'>; q?: string; code?: string; }) {
    const { page, pageSize, sort, q, code } = params;
    const where: any = {};
    if (q) {
      where.OR = [
        { nom:    { contains: q, mode: 'insensitive' } },
        { nom_en: { contains: q, mode: 'insensitive' } },
        { code:   { contains: q, mode: 'insensitive' } },
      ];
    }
    if (code) where.code = code;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.region.count({ where }),
      this.prisma.region.findMany({
        where,
        orderBy: sort ?? { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, nom: true, nom_en: true, code: true },
      }),
    ]);
    return { total, items };
  }

  async create(dto: CreateRegionDto) {
    try {
      return await this.prisma.region.create({
        data: dto,
        select: { id: true, nom: true, nom_en: true, code: true },
      });
    } catch (e: any) {
      if (e.code === 'P2002')
        throw new BadRequestException({ message: 'Contrainte d’unicité (code).', messageE: 'Unique constraint (code).' });
      throw e;
    }
  }

  async findOne(id: number) {
    const row = await this.prisma.region.findUnique({
      where: { id },
      select: { id: true, nom: true, nom_en: true, code: true },
    });
    if (!row)
      throw new NotFoundException({ message: 'Région introuvable.', messageE: 'Region not found.' });
    return row;
  }

  async update(id: number, dto: UpdateRegionDto) {
    await this.ensureExists(id);
    try {
      return await this.prisma.region.update({
        where: { id },
        data: dto,
        select: { id: true, nom: true, nom_en: true, code: true },
      });
    } catch (e: any) {
      if (e.code === 'P2002')
        throw new BadRequestException({ message: 'Contrainte d’unicité (code).', messageE: 'Unique constraint (code).' });
      throw e;
    }
  }

  private async ensureExists(id: number) {
    const ok = await this.prisma.region.count({ where: { id } });
    if (!ok)
      throw new NotFoundException({ message: 'Région introuvable.', messageE: 'Region not found.' });
  }
}
