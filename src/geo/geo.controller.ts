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
  @ApiOperation({ summary: 'Infras dans un rayon (mètres) autour lat/lon' })
  async nearby(@Query() q: NearbyDto) {
    return await this.service.nearby({
      ...q,
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 100,
    });
  }

  @Post('geo/within')
  @ApiOperation({ summary: 'Infras dans un polygone (GeoJSON Polygon)' })
  async within(@Body() b: GeoWithinDto) {
    return await this.service.within({
      ...b,
      page: b.page ?? 1,
      pageSize: b.pageSize ?? 1000,
    });
  }

  @Get('geo/distance')
  @ApiOperation({ summary: 'Distance entre deux infrastructures (m, km)' })
  async distance(@Query() q: DistanceDto) {
    return await this.service.distance(q.fromId, q.toId);
  }

  @Get('geo/tiles/heatmap')
  @ApiOperation({ summary: 'Tuiles heatmap (agrégées côté serveur)' })
  async heatmap(@Query() q: HeatmapTileDto) {
    return await this.service.heatmapTile(q.z, q.x, q.y, q.typeId);
  }
}
