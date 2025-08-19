import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Order = Record<string, 'asc' | 'desc'>;

function sanitizeSort(sort: string | undefined, allowed: string[]) {
  if (!sort) return undefined;
  const orders: Order = {};
  for (const token of sort.split(',').map(s => s.trim()).filter(Boolean)) {
    const desc = token.startsWith('-');
    const key = desc ? token.slice(1) : token;
    if (allowed.includes(key)) orders[key] = desc ? 'desc' : 'asc';
  }
  return Object.keys(orders).length ? orders : undefined;
}
function buildMeta(page: number, pageSize: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  return { page, pageSize, total, totalPages };
}
function toStrId(id: any) { return typeof id === 'bigint' ? id.toString() : String(id); }

@Injectable()
export class ParcoursService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    page: number; pageSize: number; sort?: Order;
    collecteurId?: number; from?: string; to?: string; req?: any;
  }) {
    const { page, pageSize, sort, collecteurId, from, to, req } = params;

    // Scoping: si user connecté et pas de collecteurId fourni → on borne à lui
    const effectivecollecteurId =
      typeof collecteurId === 'number'
        ? collecteurId
        : (req?.user?.id ?? req?.sub ?? undefined);

    const where: any = {};
    if (typeof effectivecollecteurId === 'number') where.collecteurId = effectivecollecteurId;

    if (from || to) {
      where.recordedAt = {};
      if (from) where.recordedAt.gte = new Date(from + 'T00:00:00Z');
      if (to)   where.recordedAt.lte = new Date(to   + 'T23:59:59Z');
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.parcour.count({ where }),
      this.prisma.parcour.findMany({
        where,
        orderBy: sort ?? { recordedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          collecteurId: true,
          latitude: true,
          longitude: true,
          recordedAt: true,
          created_at: true,
          updated_at: true,
        },
      }),
    ]);

    return {
      data: items.map(r => ({ ...r, id: toStrId(r.id) })),
      meta: buildMeta(page, pageSize, total),
    };
  }

  /** Création en bulk — retourne un résultat par élément (id ou erreur) */
  async createBulk(rawItems: Array<{
    latitude: number; longitude: number; recordedAt?: string; collecteurId?: number;
  }>, req?: any) {
    const results: { index: number; id?: string; error?: string }[] = [];
    // collecteurId fallback: req.user.id si non fourni
    const fallbackUserId = (req?.user?.id ?? req?.sub) as number | undefined;

    for (let i = 0; i < rawItems.length; i++) {
      const it = rawItems[i];
      try {
        const data = {
          latitude: Number(it.latitude),
          longitude: Number(it.longitude),
          recordedAt: it.recordedAt ? new Date(it.recordedAt) : new Date(),
          collecteurId: typeof it.collecteurId === 'number'
            ? it.collecteurId
            : (fallbackUserId ?? (() => { throw new Error('collecteurId manquant et utilisateur non connecté'); })()),
        };
        const created = await this.prisma.parcour.create({
          data,
          select: { id: true },
        });
        results.push({ index: i, id: toStrId(created.id) });
      } catch (e: any) {
        results.push({ index: i, error: e?.message ?? 'error' });
      }
    }
    return { results };
  }
}
