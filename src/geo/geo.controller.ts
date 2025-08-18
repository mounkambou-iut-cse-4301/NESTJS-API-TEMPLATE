import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GeoService } from './geo.service';
import { NearbyDto } from './dto/nearby.dto';
import { GeoWithinDto } from './dto/within.dto';
import { DistanceDto } from './dto/distance.dto';
import { HeatmapTileDto } from './dto/tiles.dto';

@ApiTags('Geo & Distance')
@Controller('api/v1')
export class GeoController {
  constructor(private readonly service: GeoService) {}

  @Get('geo/nearby')
  @ApiOperation({
    summary: 'Obtenir les infrastructures situées dans un rayon spécifié (en mètres) autour d’un point GPS donné (latitude, longitude).',
  })
  async nearby(@Query() q: NearbyDto) {
    return await this.service.nearby({
      ...q,
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 100,
    });
  }

  @Post('geo/within')
  @ApiOperation({
    summary: 'Obtenir les infrastructures situées à l’intérieur d’un polygone défini par des coordonnées GeoJSON.',
  })
  async within(@Body() b: GeoWithinDto) {
    return await this.service.within({
      ...b,
      page: b.page ?? 1,
      pageSize: b.pageSize ?? 1000,
    });
  }

  @Get('geo/distance')
  @ApiOperation({
    summary: 'Calculer la distance entre deux infrastructures spécifiées par leurs identifiants, avec un résultat en mètres ou kilomètres.',
  })
  async distance(@Query() q: DistanceDto) {
    return await this.service.distance(q.fromId, q.toId);
  }

  @Get('geo/tiles/heatmap')
  @ApiOperation({
    summary: 'Obtenir des tuiles de heatmap agrégées côté serveur pour un niveau de zoom et des coordonnées spécifiques.',
  })
  async heatmap(@Query() q: HeatmapTileDto) {
    return await this.service.heatmapTile(q.z, q.x, q.y, q.typeId);
  }
}