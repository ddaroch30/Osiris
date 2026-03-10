import { Module } from '@nestjs/common';
import { TestCaseReviewController } from './test-case-review.controller';

@Module({ controllers: [TestCaseReviewController] })
export class TestCaseReviewModule {}
