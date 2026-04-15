import { getAdminDb } from "@/lib/firebase/admin";

type AuditInput = {
  entityType: string;
  entityId: string;
  action: string;
  actorUid: string;
  actorEmail?: string;
  actorRole?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
};

export async function writeAuditLog(input: AuditInput) {
  await getAdminDb().collection("audit_logs").add({
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    actorUid: input.actorUid,
    actorEmail: input.actorEmail || "",
    actorRole: input.actorRole || "",
    before: input.before || null,
    after: input.after || null,
    createdAt: new Date(),
  });
}