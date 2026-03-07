import { Module } from '@nestjs/common';
import { TestReviewController } from './test-review.controller';
import { TestReviewService } from './test-review.service';

@Module({ controllers: [TestReviewController], providers: [TestReviewService] })
export class TestReviewModule {}
