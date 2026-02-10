import { Global, Module, DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { STORAGE_PROVIDER } from './storage.constants';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';

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
              case 's3': {
                return new S3StorageProvider({
                  bucket: configService.getOrThrow<string>('S3_BUCKET'),
                  region: configService.getOrThrow<string>('S3_REGION'),
                  endpoint: configService.getOrThrow<string>('S3_ENDPOINT'),
                  publicUrl: configService.getOrThrow<string>('S3_PUBLIC_URL'),
                  forcePathStyle: configService.get<string>('S3_FORCE_PATH_STYLE', 'true') === 'true',
                  accessKeyId: configService.get<string>('S3_ACCESS_KEY_ID'),
                  secretAccessKey: configService.get<string>('S3_SECRET_ACCESS_KEY'),
                });
              }
              default:
                throw new Error(`Unknown STORAGE_DRIVER: "${driver}". Supported: local, s3`);
            }
          },
          inject: [ConfigService],
        },
      ],
      exports: [STORAGE_PROVIDER],
    };
  }
}
