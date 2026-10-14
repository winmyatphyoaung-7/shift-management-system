import type { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";

type CreateNotificationInput = {
  recipientUserId: string;
  storeId?: string | null;
  type: Prisma.NotificationCreateManyInput["type"];
  title: string;
  message: string;
  referenceData?: Prisma.InputJsonValue;
};

export async function createNotifications(
  transaction: Prisma.TransactionClient,
  inputs: CreateNotificationInput[],
): Promise<void> {
  if (inputs.length === 0) {
    return;
  }

  await transaction.notification.createMany({
    data: inputs.map((input) => ({
      recipientUserId: input.recipientUserId,
      storeId: input.storeId ?? null,
      type: input.type,
      title: input.title,
      message: input.message,

      ...(input.referenceData === undefined
        ? {}
        : {
            referenceData:
              input.referenceData,
          }),
    })),
  });
}
export async function listNotifications(
  userId: string,
  storeId: string,
) {
  const [notifications, unreadCount] =
    await prisma.$transaction([
      prisma.notification.findMany({
        where: {
          recipientUserId: userId,
          OR: [
            {
              storeId,
            },
            {
              storeId: null,
            },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          referenceData: true,
          readAt: true,
          createdAt: true,
        },
      }),

      prisma.notification.count({
        where: {
          recipientUserId: userId,
          readAt: null,
          OR: [
            {
              storeId,
            },
            {
              storeId: null,
            },
          ],
        },
      }),
    ]);

  return {
    notifications,
    unreadCount,
  };
}
export async function markNotificationRead(
  userId: string,
  storeId: string,
  notificationId: string,
) {
  return prisma.$transaction(
    async (transaction) => {
      const notification =
        await transaction.notification.findFirst({
          where: {
            id: notificationId,
            recipientUserId: userId,
            OR: [
              {
                storeId,
              },
              {
                storeId: null,
              },
            ],
          },
          select: {
            id: true,
            readAt: true,
          },
        });

      if (!notification) {
        throw new AppError(
          404,
          "NOTIFICATION_NOT_FOUND",
          "Notification not found",
        );
      }

      if (!notification.readAt) {
        await transaction.notification.updateMany({
          where: {
            id: notification.id,
            recipientUserId: userId,
            readAt: null,
          },
          data: {
            readAt: new Date(),
          },
        });
      }

      return transaction.notification.findUniqueOrThrow({
        where: {
          id: notification.id,
        },
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          referenceData: true,
          readAt: true,
          createdAt: true,
        },
      });
    },
  );
}

export async function markAllNotificationsRead(
  userId: string,
  storeId: string,
) {
  const result =
    await prisma.notification.updateMany({
      where: {
        recipientUserId: userId,
        readAt: null,
        OR: [
          {
            storeId,
          },
          {
            storeId: null,
          },
        ],
      },
      data: {
        readAt: new Date(),
      },
    });

  return {
    updatedCount: result.count,
  };
}