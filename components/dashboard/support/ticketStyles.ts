import { FaCircleDot, FaHourglassHalf, FaCircleCheck, FaLock, FaFlag } from "react-icons/fa6";
import type { IconType } from "react-icons";
import type { TicketPriority, TicketStatus } from "@/lib/types";

export const STATUS: Record<TicketStatus, { label: string; Icon: IconType; cls: string }> = {
  open: { label: "Open", Icon: FaCircleDot, cls: "bg-blue-50 text-blue-800" },
  in_progress: { label: "In progress", Icon: FaHourglassHalf, cls: "bg-amber-50 text-amber-800" },
  resolved: { label: "Resolved", Icon: FaCircleCheck, cls: "bg-emerald-50 text-emerald-700" },
  closed: { label: "Closed", Icon: FaLock, cls: "bg-slate-100 text-slate-600" },
};

export const PRIORITY: Record<TicketPriority, { label: string; Icon: IconType; dot: string }> = {
  low: { label: "Low", Icon: FaFlag, dot: "text-slate-400" },
  normal: { label: "Normal", Icon: FaFlag, dot: "text-blue-600" },
  urgent: { label: "Urgent", Icon: FaFlag, dot: "text-rose-600" },
};
