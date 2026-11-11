import type { Activity } from "@/lib/activity";
import { formatDateTime, formatMoney, formatPoints, shortAddress } from "@/lib/format";
import { Avatar } from "./Avatar";
import { EmptyState } from "./ui";

type ActivityTableProps = {
  activities: Activity[];
  /** Whose movements these are. Decides what the first column is called. */
  perspective: "restaurant" | "customer";
  emptyText: string;
};

const headerClass = "px-3 py-2.5 text-left text-xs font-normal text-white/45";
const cellClass = "px-3 py-3 text-sm";

export function ActivityTable({ activities, perspective, emptyText }: ActivityTableProps) {
  if (activities.length === 0) return <EmptyState mood="wink">{emptyText}</EmptyState>;

  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
      <table className="w-full min-w-[34rem] border-collapse">
        <thead className="bg-white/[0.03]">
          <tr>
            <th scope="col" className={headerClass}>
              {perspective === "restaurant" ? "Customer" : "Restaurant"}
            </th>
            <th scope="col" className={headerClass}>
              Activity
            </th>
            <th scope="col" className={headerClass}>
              Points
            </th>
            <th scope="col" className={headerClass}>
              Last activity
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {activities.map((activity) => {
            const spent = activity.kind === "reward";
            return (
              <tr key={activity.id}>
                <td className={cellClass}>
                  <div className="flex items-center gap-3">
                    <Avatar seed={activity.counterparty} size="sm" label={activity.counterpartyName ?? ""} />
                    <div className="min-w-0">
                      {activity.counterpartyName ? (
                        <p className="truncate text-white">{activity.counterpartyName}</p>
                      ) : null}
                      <p
                        className={`font-mono text-xs ${
                          activity.counterpartyName ? "text-white/45" : "text-white"
                        }`}
                      >
                        {shortAddress(activity.counterparty)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className={cellClass}>
                  <p className="text-white">{activity.detail}</p>
                  <p className="text-xs text-white/45">
                    {spent ? "Reward claimed" : `Paid ${formatMoney(activity.paid)}`}
                  </p>
                </td>
                <td className={`${cellClass} font-medium ${spent ? "text-red-400" : "text-emerald-400"}`}>
                  {spent ? "−" : "+"}
                  {formatPoints(activity.points)}
                  <span className="ml-1.5 text-xs font-normal text-white/45">{activity.symbol}</span>
                </td>
                <td className={`${cellClass} whitespace-nowrap text-white/60`}>
                  {formatDateTime(activity.timestamp)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
