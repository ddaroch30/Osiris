import { Global, Module } from '@nestjs/common';
import { InMemoryStore } from './in-memory-store';
import { PrismaService } from './prisma.service';

@Global()
@Module({ providers: [InMemoryStore, PrismaService], exports: [InMemoryStore, PrismaService] })
export class CommonModule {}
