import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SETTINGS_KEYS } from './settings.constants';

@Injectable()
export class SettingsService implements OnModuleInit {
  private cache = new Map<string, string>();

  private readonly defaults: Map<string, string | null>;

  constructor(private readonly prisma: PrismaService) {
    this.defaults = new Map(
      Object.values(SETTINGS_KEYS).map((s) => [s.key, s.default]),
    );
  }

  async onModuleInit() {
    const settings = await this.prisma.setting.findMany();
    for (const s of settings) {
      this.cache.set(s.key, s.value);
    }
  }

  get(key: string): string | null {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    return this.defaults.get(key) ?? null;
  }

  getAll(): Map<string, string | null> {
    const result = new Map<string, string | null>();
    for (const [key, defaultValue] of this.defaults) {
      result.set(key, this.cache.get(key) ?? defaultValue);
    }
    for (const [key, value] of this.cache) {
      if (!result.has(key)) {
        result.set(key, value);
      }
    }
    return result;
  }

  async update(key: string, value: string): Promise<void> {
    await this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    this.cache.set(key, value);
  }

  async bulkUpdate(entries: { key: string; value: string }[]): Promise<void> {
    await this.prisma.$transaction(
      entries.map((entry) =>
        this.prisma.setting.upsert({
          where: { key: entry.key },
          update: { value: entry.value },
          create: { key: entry.key, value: entry.value },
        }),
      ),
    );
    for (const entry of entries) {
      this.cache.set(entry.key, entry.value);
    }
  }
}
