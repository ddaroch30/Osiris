import { Body, Controller, Post } from '@nestjs/common';
import { IsArray, IsString } from 'class-validator';
import { ok } from '../common/api-response';
import { TestCaseGenerationService } from './test-case-generation.service';

class RequirementDto {
  @IsString() externalKey!: string;
  @IsString() summary!: string;
}

class GenerateDto {
  @IsArray() requirements!: RequirementDto[];
}

@Controller('generation-batches')
export class TestCaseGenerationController {
  constructor(private readonly service: TestCaseGenerationService) {}

  @Post()
  generate(@Body() body: GenerateDto) {
    const generated = this.service.generate(body.requirements);
    const coverage = body.requirements.map((r) => ({ requirementKey: r.externalKey, total: 2, approved: 0, warning: null }));
    return ok({ batchId: `batch_${Date.now()}`, generated, coverage });
  }
}
