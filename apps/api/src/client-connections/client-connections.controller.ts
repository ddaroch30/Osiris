import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { ok } from '../common/api-response';
import { ClientConnectionsService, ProviderType } from './client-connections.service';

class CreateConnectionDto {
  @IsString() name!: string;
  @IsEnum(ProviderType) providerType!: ProviderType;
  @IsUrl() jiraBaseUrl!: string;
  @IsOptional() @IsUrl() zephyrBaseUrl?: string;
  @IsString() usernameOrEmail!: string;
  @IsString() token!: string;
}

@Controller('connections')
export class ClientConnectionsController {
  constructor(private readonly service: ClientConnectionsService) {}

  @Get()
  list() {
    return ok(this.service.list());
  }

  @Post('validate')
  validate(@Body() dto: CreateConnectionDto) {
    return ok(this.service.validate(dto));
  }

  @Post()
  create(@Body() dto: CreateConnectionDto) {
    return ok(this.service.create(dto));
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return ok(this.service.get(id));
  }
}
