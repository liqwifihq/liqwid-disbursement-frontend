const labels: Record<string, string> = {
  ready: 'Ready',
  approved: 'Approved',
  pending: 'Pending',
  processing: 'Processing',
  pending_review: 'Needs review',
  succeeded: 'Succeeded',
  completed: 'Completed',
  failed: 'Failed',
  completed_with_errors: 'Completed with errors',
  simulated: 'Simulated',
}

export default function StatusBadge({ status = 'pending' }: { status?: string }) {
  const key = status.toLowerCase()
  return <span className={`status status-${key}`}>{labels[key] || status.replace(/_/g, ' ')}</span>
}
