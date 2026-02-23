import { UserRole } from "@/generated/prisma";

type Action =
  | "user.invite"
  | "user.manage"
  | "company.edit"
  | "location.manage"
  | "order.create"
  | "order.edit_draft"
  | "order.cancel"
  | "order.update_status"
  | "order.reorder"
  | "saved_product.create"
  | "saved_product.edit"
  | "saved_product.delete"
  | "artwork.upload"
  | "artwork.delete"
  | "proof.publish"
  | "proof.annotate"
  | "proof.approve"
  | "proof.request_revision"
  | "invoice.issue"
  | "invoice.pay"
  | "invoice.void"
  | "payment_method.manage"
  | "thread.create"
  | "thread.close"
  | "inventory.view"
  | "inventory.adjust"
  | "inventory.view_ledger"
  | "admin.view_all_tenants"
  | "admin.create_company"
  | "admin.view_audit_log";

const PERMISSIONS: Record<Action, UserRole[]> = {
  "user.invite": [UserRole.CLIENT_ADMIN, UserRole.CCC_STAFF],
  "user.manage": [UserRole.CLIENT_ADMIN, UserRole.CCC_STAFF],
  "company.edit": [UserRole.CLIENT_ADMIN, UserRole.CCC_STAFF],
  "location.manage": [UserRole.CLIENT_ADMIN, UserRole.CCC_STAFF],

  "order.create": [UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER, UserRole.CCC_STAFF],
  "order.edit_draft": [UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER, UserRole.CCC_STAFF],
  "order.cancel": [UserRole.CLIENT_ADMIN, UserRole.CCC_STAFF],
  "order.update_status": [UserRole.CCC_STAFF],
  "order.reorder": [UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER],

  "saved_product.create": [UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER],
  "saved_product.edit": [UserRole.CLIENT_ADMIN],
  "saved_product.delete": [UserRole.CLIENT_ADMIN],

  "artwork.upload": [UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER, UserRole.CCC_STAFF],
  "artwork.delete": [UserRole.CLIENT_ADMIN, UserRole.CCC_STAFF],

  "proof.publish": [UserRole.CCC_STAFF],
  "proof.annotate": [UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER, UserRole.CCC_STAFF],
  "proof.approve": [UserRole.CLIENT_ADMIN],
  "proof.request_revision": [UserRole.CLIENT_ADMIN],

  "invoice.issue": [UserRole.CCC_STAFF],
  "invoice.pay": [UserRole.CLIENT_ADMIN],
  "invoice.void": [UserRole.CCC_STAFF],
  "payment_method.manage": [UserRole.CLIENT_ADMIN],

  "thread.create": [UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER, UserRole.CCC_STAFF],
  "thread.close": [UserRole.CLIENT_ADMIN, UserRole.CCC_STAFF],

  "inventory.view": [UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER, UserRole.CCC_STAFF],
  "inventory.adjust": [UserRole.CCC_STAFF],
  "inventory.view_ledger": [UserRole.CLIENT_ADMIN, UserRole.CCC_STAFF],

  "admin.view_all_tenants": [UserRole.CCC_STAFF],
  "admin.create_company": [UserRole.CCC_STAFF],
  "admin.view_audit_log": [UserRole.CCC_STAFF],
};

export function can(role: UserRole, action: Action): boolean {
  return PERMISSIONS[action]?.includes(role) ?? false;
}

export function assertCan(role: UserRole, action: Action): void {
  if (!can(role, action)) {
    throw new Error(`Forbidden: role ${role} cannot perform ${action}`);
  }
}

export function isStaff(role: UserRole): boolean {
  return role === UserRole.CCC_STAFF;
}

export type { Action };
