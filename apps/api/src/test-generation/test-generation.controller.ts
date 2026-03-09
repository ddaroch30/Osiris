import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { ok } from '../common/api-response';
import { resolveOrgId, resolveUserId } from '../common/org-context';
import { TestGenerationService } from './test-generation.service';

class RequirementInput {
  @IsString() externalId!: string;
  @IsString() key!: string;
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() acceptanceCriteria?: string;
  @IsOptional() @IsString() priority?: string;
}
class CreateBatchDto {
  @IsString() connectionId!: string;
  @IsString() projectExternalId!: string;
  @IsOptional() @IsString() releaseContextExternalId?: string;
  @IsArray() requirements!: RequirementInput[];
}

@Controller('generation-batches')
export class TestGenerationController {
  constructor(private readonly service: TestGenerationService) {}
  @Post()
  async create(@Headers() headers: Record<string, unknown>, @Body() body: CreateBatchDto) {
    return ok(await this.service.generate(resolveOrgId(headers), resolveUserId(headers), body));
  }

  @Get(':id/test-cases')
  list(@Param('id') id: string) { return ok(this.service.list(id)); }
}
