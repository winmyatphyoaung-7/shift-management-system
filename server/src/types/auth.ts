export type AuthenticatedMember = {
  userId: string;
  membershipId: string;
  storeId: string;
  loginId: string;
  name: string;
  role: "MANAGER" | "STAFF";
  mustChangePassword: boolean;
};