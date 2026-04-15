import { useState } from "react";
import { formatDate } from "../utils/formatDate";

/**
 * Shared hook for task-rejection logic used across CollectorPanel,
 * MeterReaderPanel and TechnicianPanel.
 */
export function useTaskActions(setTaskList, userId) {
  const [rejectingTaskId, setRejectingTaskId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  function updateTaskStatus(taskId, status) {
    setTaskList(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  }

  function rejectTask(taskId) {
    if (!rejectReason.trim()) return;
    setTaskList(prev => prev.map(t => t.id === taskId ? {
      ...t,
      status: "נדחה",
      rejectionReason: rejectReason,
      rejectedBy: userId,
      rejectedAt: new Date().toISOString().split("T")[0],
    } : t));
    setRejectingTaskId(null);
    setRejectReason("");
  }

  return { rejectingTaskId, setRejectingTaskId, rejectReason, setRejectReason, updateTaskStatus, rejectTask };
}
