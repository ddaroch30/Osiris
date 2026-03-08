import { Module } from '@nestjs/common';
import { TestCaseGenerationController } from './test-case-generation.controller';
import { TestCaseGenerationService } from './test-case-generation.service';

@Module({ controllers: [TestCaseGenerationController], providers: [TestCaseGenerationService], exports: [TestCaseGenerationService] })
export class TestCaseGenerationModule {}
