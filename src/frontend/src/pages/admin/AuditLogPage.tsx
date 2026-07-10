import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetAuditLog } from "@/hooks/useBackend";
import type { AuditEntry } from "@/types";
import { format } from "date-fns";
import { ClipboardList } from "lucide-react";

export default function AuditLogPage() {
  const { data: logs, isLoading } = useGetAuditLog();

  const formatTimestamp = (ts: bigint | string | number) => {
    const ms =
      typeof ts === "bigint"
        ? Number(ts) / 1_000_000
        : typeof ts === "string"
          ? new Date(ts).getTime()
          : ts;
    const date = new Date(ms);
    return {
      date: format(date, "dd MMM yyyy"),
      time: format(date, "HH:mm:ss"),
    };
  };

  const actionLabels: Record<string, string> = {
    StudentRegistration: "Student Registered",
    BookRequest: "Book Request Created",
    BookApproval: "Book Approved",
    BookRejection: "Book Rejected",
    BookIssue: "Book Issued",
    BookReturn: "Book Returned",
    ReservationCreated: "Reservation Created",
    ProcurementRequested: "Procurement Requested",
    AdminLogin: "Admin Login",
    ProfileUpdate: "Profile Updated",
    YearPromotion: "Year Promoted",
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-100 rounded-lg">
            <ClipboardList className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-sm text-gray-500">
              Complete history of all system actions
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, i) => `s${i}`).map((k) => (
              <div
                key={k}
                className="h-14 bg-sky-50 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-sky-200" />
            <p>No audit logs yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-sky-100 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sky-600 text-white">
                  <th className="text-left px-4 py-3 font-semibold">Actor</th>
                  <th className="text-left px-4 py-3 font-semibold">Action</th>
                  <th className="text-left px-4 py-3 font-semibold">
                    Resource
                  </th>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="text-left px-4 py-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: AuditEntry, i: number) => {
                  const { date, time } = formatTimestamp(log.timestamp);
                  return (
                    <tr
                      key={log.id || i}
                      className={i % 2 === 0 ? "bg-white" : "bg-sky-50"}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div className="text-xs text-gray-500">
                          {log.actorType || "System"}
                        </div>
                        <div>{log.actorId || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
                          {actionLabels[log.action] || log.action || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {log.resourceId || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {date}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {time}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
