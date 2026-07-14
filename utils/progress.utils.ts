/**
 * Calculates project progress as an integer percentage (0–100).
 * Returns 0 when there are no tasks.
 */
export function calculateProjectProgress(
  totalTasks: number,
  doneTasks: number
): number {
  if (totalTasks === 0) return 0;
  return Math.floor((doneTasks / totalTasks) * 100);
}
