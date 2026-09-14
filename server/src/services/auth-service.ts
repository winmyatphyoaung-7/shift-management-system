import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import type { AuthTokenPayload } from "./token-service.js";
import type { AuthenticatedMember } from "../types/auth.js";

const PASSWORD_HASH_ROUNDS = 12;

export async function findActiveMembershipByLoginId(
    loginId: string,
) {
    return prisma.storeMember.findFirst({
        where: {
            loginId,
            status: "ACTIVE",
        },
        select: {
            id: true,
            storeId: true,
            loginId: true,
            role: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    passwordHash: true,
                    mustChangePassword: true,
                },
            },
        },
    });
}

export async function authenticateMember(
    loginId: string,
    password: string,
): Promise<AuthenticatedMember | null> {
    const membership =
        await findActiveMembershipByLoginId(loginId);

    if (!membership) {
        return null;
    }

    const passwordMatches = await bcrypt.compare( // bcrypt.compare() က password ကို hash နဲ့ နှိုင်းယှဉ်ပြီး စစ်ဆေးပေးပါတယ်။
        password,                                   //မှားနေရင် passwordMatches က false , မှန်နေရင် trueပြန်ပေး ပါ တယ်။
        membership.user.passwordHash,
    );

    if (!passwordMatches) {
        return null;
    }

    return {
        userId: membership.user.id,
        membershipId: membership.id,
        storeId: membership.storeId,
        loginId: membership.loginId,
        name: membership.user.name,
        role: membership.role,
        mustChangePassword:
            membership.user.mustChangePassword,
    };
}

export async function findCurrentAuthMember(
  payload: AuthTokenPayload,
): Promise<AuthenticatedMember | null> {
  const membership =
    await prisma.storeMember.findUnique({
      where: {
        id: payload.membershipId,
      },
      select: {
        id: true,
        storeId: true,
        loginId: true,
        role: true,
        status: true,
        user: {
          select: {
            id: true,
            name: true,
            mustChangePassword: true,
          },
        },
      },
    });

  if (!membership) {
    return null;
  }

  const membershipIsValid =
    membership.status === "ACTIVE" &&
    membership.user.id === payload.userId &&
    membership.storeId === payload.storeId &&
    membership.role === payload.role;

  if (!membershipIsValid) {
    return null;
  }

  return {
    userId: membership.user.id,
    membershipId: membership.id,
    storeId: membership.storeId,
    loginId: membership.loginId,
    name: membership.user.name,
    role: membership.role,
    mustChangePassword:
      membership.user.mustChangePassword,
  };
}

export async function changeMemberPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      passwordHash: true,
    },
  });

  if (!user) {
    return false;
  }

  const currentPasswordMatches =
    await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

  if (!currentPasswordMatches) {
    return false;
  }

  const newPasswordHash = await bcrypt.hash(
    newPassword,
    PASSWORD_HASH_ROUNDS,
  );

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      passwordHash: newPasswordHash,
      mustChangePassword: false,
    },
  });

  return true;
}