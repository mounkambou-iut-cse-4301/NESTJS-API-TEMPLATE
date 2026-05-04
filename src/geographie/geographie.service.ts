import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  GetArrondissementsQueryDto,
  GetDepartementsQueryDto,
  GetRegionsQueryDto,
} from './dto/query-geographie.dto';

@Injectable()
export class GeographieService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeName(value?: string): string | undefined {
    if (!value || !value.trim()) return undefined;

    return value
      .trim()
      .replace(/\s+/g, ' ')
      .toLocaleUpperCase('fr-FR');
  }

  private getPagination(page?: number, limit?: number) {
    const safePage = Math.max(1, Number(page || 1));
    const safeLimit = Math.min(200, Math.max(1, Number(limit || 50)));

    return {
      page: safePage,
      limit: safeLimit,
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    };
  }

  private buildMeta(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  private mapRegion(region: any) {
    return {
      id: region.id,
      name: region.name,
      nameEn: region.nameEn,
      totalDepartements: region._count?.departements || 0,
      createdAt: region.createdAt?.toISOString(),
      updatedAt: region.updatedAt?.toISOString(),
    };
  }

  private mapDepartement(departement: any) {
    return {
      id: departement.id,
      name: departement.name,
      nameEn: departement.nameEn,
      regionId: departement.regionId,
      region: departement.region
        ? {
            id: departement.region.id,
            name: departement.region.name,
            nameEn: departement.region.nameEn,
          }
        : null,
      totalArrondissements: departement._count?.arrodissements || 0,
      createdAt: departement.createdAt?.toISOString(),
      updatedAt: departement.updatedAt?.toISOString(),
    };
  }

  private mapArrodissement(arrodissement: any) {
    return {
      id: arrodissement.id,
      name: arrodissement.name,
      nameEn: arrodissement.nameEn,
      departementId: arrodissement.departementId,
      departement: arrodissement.departement
        ? {
            id: arrodissement.departement.id,
            name: arrodissement.departement.name,
            nameEn: arrodissement.departement.nameEn,
            regionId: arrodissement.departement.regionId,
            region: arrodissement.departement.region
              ? {
                  id: arrodissement.departement.region.id,
                  name: arrodissement.departement.region.name,
                  nameEn: arrodissement.departement.region.nameEn,
                }
              : null,
          }
        : null,
      createdAt: arrodissement.createdAt?.toISOString(),
      updatedAt: arrodissement.updatedAt?.toISOString(),
    };
  }

  async getRegions(query: GetRegionsQueryDto) {
    const { page, limit, skip, take } = this.getPagination(query.page, query.limit);
    const searchName = this.normalizeName(query.name);

    const where: Prisma.RegionWhereInput = {};

    if (searchName) {
      where.OR = [
        {
          name: {
            contains: searchName,
          },
        },
        {
          nameEn: {
            contains: searchName,
          },
        },
      ];
    }

    const [total, regions] = await Promise.all([
      this.prisma.region.count({ where }),
      this.prisma.region.findMany({
        where,
        skip,
        take,
        orderBy: {
          name: 'asc',
        },
        include: {
          _count: {
            select: {
              departements: true,
            },
          },
        },
      }),
    ]);

    return {
      message: 'Liste des régions récupérée avec succès.',
      messageE: 'Regions fetched successfully.',
      data: regions.map((region) => this.mapRegion(region)),
      meta: this.buildMeta(page, limit, total),
    };
  }

  async getDepartements(query: GetDepartementsQueryDto) {
    const { page, limit, skip, take } = this.getPagination(query.page, query.limit);
    const searchName = this.normalizeName(query.name);

    const where: Prisma.DepartementWhereInput = {};

    if (query.regionId) {
      where.regionId = query.regionId;
    }

    if (searchName) {
      where.OR = [
        {
          name: {
            contains: searchName,
          },
        },
        {
          nameEn: {
            contains: searchName,
          },
        },
      ];
    }

    const [total, departements] = await Promise.all([
      this.prisma.departement.count({ where }),
      this.prisma.departement.findMany({
        where,
        skip,
        take,
        orderBy: [
          {
            region: {
              name: 'asc',
            },
          },
          {
            name: 'asc',
          },
        ],
        include: {
          region: {
            select: {
              id: true,
              name: true,
              nameEn: true,
            },
          },
          _count: {
            select: {
              arrodissements: true,
            },
          },
        },
      }),
    ]);

    return {
      message: 'Liste des départements récupérée avec succès.',
      messageE: 'Divisions fetched successfully.',
      data: departements.map((departement) => this.mapDepartement(departement)),
      meta: this.buildMeta(page, limit, total),
    };
  }

  async getArrondissements(query: GetArrondissementsQueryDto) {
    const { page, limit, skip, take } = this.getPagination(query.page, query.limit);
    const searchName = this.normalizeName(query.name);

    const where: Prisma.ArrodissementWhereInput = {};

    if (query.departementId) {
      where.departementId = query.departementId;
    }

    if (query.regionId) {
      where.departement = {
        regionId: query.regionId,
      };
    }

    if (searchName) {
      where.OR = [
        {
          name: {
            contains: searchName,
          },
        },
        {
          nameEn: {
            contains: searchName,
          },
        },
      ];
    }

    const [total, arrondissements] = await Promise.all([
      this.prisma.arrodissement.count({ where }),
      this.prisma.arrodissement.findMany({
        where,
        skip,
        take,
        orderBy: [
          {
            departement: {
              region: {
                name: 'asc',
              },
            },
          },
          {
            departement: {
              name: 'asc',
            },
          },
          {
            name: 'asc',
          },
        ],
        include: {
          departement: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              regionId: true,
              region: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      message: 'Liste des arrondissements récupérée avec succès.',
      messageE: 'Subdivisions fetched successfully.',
      data: arrondissements.map((arrodissement) =>
        this.mapArrodissement(arrodissement),
      ),
      meta: this.buildMeta(page, limit, total),
    };
  }
}