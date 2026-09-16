import bcrypt from "bcrypt";

import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";
import type {
  CreateMemberBody,
  UpdateMemberBody,
} from "../schemas/member-schema.js";

const PASSWORD_HASH_ROUNDS = 12;

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
    PASSWORD_HASH_ROUNDS,
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

export async function updateStoreMember(
  storeId: string,
  membershipId: string,
  input: UpdateMemberBody,
) {
  const existingMembership =
    await prisma.storeMember.findFirst({
      where: {
        id: membershipId,
        storeId,
      },
      select: {
        id: true,
      },
    });

  if (!existingMembership) {
    throw new AppError(
      404,
      "MEMBER_NOT_FOUND",
      "Member not found",
    );
  }

  try {
    const membership =
      await prisma.storeMember.update({
        where: {
          id: membershipId,
        },
        data: {
          ...(input.loginId !== undefined && {
            loginId: input.loginId,
          }),

          ...(input.colorKey !== undefined && {
            colorKey: input.colorKey,
          }),

          ...(input.name !== undefined && {
            user: {
              update: {
                name: input.name,
              },
            },
          }),
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

export async function resetStaffMemberPassword(
  storeId: string,
  membershipId: string,
  temporaryPassword: string,
): Promise<void> {
  const membership =
    await prisma.storeMember.findFirst({
      where: {
        id: membershipId,
        storeId,
      },
      select: {
        id: true,
        userId: true,
        role: true,
        status: true,
      },
    });

  if (!membership) {
    throw new AppError(
      404,
      "MEMBER_NOT_FOUND",
      "Member not found",
    );
  }

  if (membership.role !== "STAFF") {
    throw new AppError(
      400,
      "MANAGER_PASSWORD_RESET_NOT_ALLOWED",
      "Manager password must be changed using the current password",
    );
  }

  if (membership.status !== "ACTIVE") {
    throw new AppError(
      409,
      "MEMBER_INACTIVE",
      "Inactive member password cannot be reset",
    );
  }

  const passwordHash = await bcrypt.hash(
    temporaryPassword,
    PASSWORD_HASH_ROUNDS,
  );

  await prisma.user.update({
    where: {
      id: membership.userId,
    },
    data: {
      passwordHash,
      mustChangePassword: true,
    },
  });
}