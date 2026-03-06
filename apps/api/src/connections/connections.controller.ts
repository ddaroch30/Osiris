import { Body, Controller, Delete, Get, Headers, Param, Post } from '@nestjs/common';
import { IsEnum, IsObject, IsOptional, IsString, IsUrl } from 'class-validator';
import { ok } from '../common/api-response';
import { resolveOrgId, resolveUserId } from '../common/org-context';
import { ToolType } from '../common/enums';
import { ConnectionsService } from './connections.service';

class CreateConnectionDto {
  @IsString() name!: string;
  @IsEnum(ToolType) toolType!: ToolType;
  @IsUrl() baseUrl!: string;
  @IsOptional() @IsUrl() secondaryBaseUrl?: string;
  @IsString() authType!: string;
  @IsOptional() @IsString() username?: string;
  @IsString() secret!: string;
  @IsOptional() @IsObject() metadataJson?: Record<string, unknown>;
}

@Controller('connections')
export class ConnectionsController {
  constructor(private readonly service: ConnectionsService) {}

  @Get()
  list(@Headers() headers: Record<string, unknown>) { return ok(this.service.list(resolveOrgId(headers))); }

  @Post()
  create(@Headers() headers: Record<string, unknown>, @Body() body: CreateConnectionDto) {
    return ok(this.service.create(resolveOrgId(headers), resolveUserId(headers), body));
  }

  @Get(':id')
  get(@Headers() headers: Record<string, unknown>, @Param('id') id: string) { return ok(this.service.get(resolveOrgId(headers), id)); }

  @Post('validate')
  async validateInput(@Body() body: CreateConnectionDto) {
    return ok(await this.service.validateInput(body));
  }

  @Post(':id/validate')
  async validate(@Headers() headers: Record<string, unknown>, @Param('id') id: string) { return ok(await this.service.validate(resolveOrgId(headers), id)); }

  @Delete(':id')
  remove(@Headers() headers: Record<string, unknown>, @Param('id') id: string) { return ok(this.service.remove(resolveOrgId(headers), id)); }
}
