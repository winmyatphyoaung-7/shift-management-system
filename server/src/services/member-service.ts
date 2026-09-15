import bcrypt from "bcrypt";

import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";
import type { CreateMemberBody } from "../schemas/member-schema.js";

export async function listStoreMembers(
  storeId: string,
) {
  const memberships =
    await prisma.storeMember.findMany({
      where: {
        storeId,
      },
      orderBy: {
        loginId: "asc",
      },
      select: {
        id: true,
        loginId: true,
        role: true,
        status: true,
        colorKey: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            mustChangePassword: true,
          },
        },
      },
    });

  return memberships.map((membership) => ({
    id: membership.id,
    userId: membership.user.id,
    loginId: membership.loginId,
    name: membership.user.name,
    role: membership.role,
    status: membership.status,
    colorKey: membership.colorKey,
    mustChangePassword:
      membership.user.mustChangePassword,
    createdAt: membership.createdAt,
    updatedAt: membership.updatedAt,
  }));
}

type CreateStaffMemberInput = Pick<
  CreateMemberBody,
  | "name"
  | "loginId"
  | "temporaryPassword"
  | "colorKey"
>;

function isUniqueConstraintError(
  error: unknown,
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function createStaffMember(
  storeId: string,
  input: CreateStaffMemberInput,
) {
  const passwordHash = await bcrypt.hash(
    input.temporaryPassword,
    12,
  );

  try {
    const membership =
      await prisma.storeMember.create({
        data: {
          loginId: input.loginId,
          role: "STAFF",
          status: "ACTIVE",
          colorKey: input.colorKey,

          store: {
            connect: {
              id: storeId,
            },
          },

          user: {
            create: {
              name: input.name,
              passwordHash,
              mustChangePassword: true,
            },
          },
        },
        select: {
          id: true,
          loginId: true,
          role: true,
          status: true,
          colorKey: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              mustChangePassword: true,
            },
          },
        },
      });

    return {
      id: membership.id,
      userId: membership.user.id,
      loginId: membership.loginId,
      name: membership.user.name,
      role: membership.role,
      status: membership.status,
      colorKey: membership.colorKey,
      mustChangePassword:
        membership.user.mustChangePassword,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(
        409,
        "LOGIN_ID_ALREADY_EXISTS",
        "Login ID is already in use",
      );
    }

    throw error;
  }
}