import { Injectable } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface UpsertFromOidcParams {
  sub: string;
  email: string;
  name: string;
  role: Role;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertFromOidc(params: UpsertFromOidcParams): Promise<User> {
    return this.prisma.user.upsert({
      where: { oidcSub: params.sub },
      create: {
        oidcSub: params.sub,
        email: params.email,
        name: params.name,
        role: params.role,
      },
      update: {
        email: params.email,
        name: params.name,
        role: params.role,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
