import { DynamicModule } from '@nestjs/common';

export interface ConfigModuleOptions {
  isGlobal?: boolean;
  envFilePath?: string | string[];
}

export declare class ConfigModule {
  static forRoot(options?: ConfigModuleOptions): DynamicModule;
}
