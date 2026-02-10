import { Global, Module, DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { STORAGE_PROVIDER } from './storage.constants';
import { LocalStorageProvider } from './local-storage.provider';

@Global()
@Module({})
export class StorageModule {
  static forRoot(): DynamicModule {
    return {
      module: StorageModule,
      imports: [
        ServeStaticModule.forRootAsync({
          useFactory: (configService: ConfigService) => {
            const driver = configService.get<string>('STORAGE_DRIVER', 'local');
            if (driver !== 'local') return [];
            const uploadDir = configService.get<string>('UPLOAD_DIR', './uploads');
            return [{ rootPath: join(process.cwd(), uploadDir), serveRoot: '/uploads' }];
          },
          inject: [ConfigService],
        }),
      ],
      providers: [
        {
          provide: STORAGE_PROVIDER,
          useFactory: (configService: ConfigService) => {
            const driver = configService.get<string>('STORAGE_DRIVER', 'local');
            switch (driver) {
              case 'local': {
                const uploadDir = configService.get<string>('UPLOAD_DIR', './uploads');
                return new LocalStorageProvider(join(process.cwd(), uploadDir));
              }
              // case 's3': {
              //   const bucket = configService.getOrThrow<string>('S3_BUCKET');
              //   const region = configService.getOrThrow<string>('S3_REGION');
              //   const endpoint = configService.get<string>('S3_ENDPOINT');
              //   return new S3StorageProvider(bucket, region, endpoint);
              // }
              default:
                throw new Error(`Unknown STORAGE_DRIVER: "${driver}". Supported: local`);
            }
          },
          inject: [ConfigService],
        },
      ],
      exports: [STORAGE_PROVIDER],
    };
  }
}
