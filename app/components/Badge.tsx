interface BadgeProps {
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  children: React.ReactNode;
}

export function Badge({ status, children }: BadgeProps) {
  const styles = {
    confirmed: 'bg-success/20 text-success border-success/30',
    pending: 'bg-warning/20 text-warning border-warning/30',
    cancelled: 'bg-destructive/20 text-destructive border-destructive/30',
    completed: 'bg-info/20 text-info border-info/30'
  };

  const icons = {
    confirmed: '✓',
    pending: '⏳',
    cancelled: '✕',
    completed: '✓'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${styles[status]}`}>
      <span>{icons[status]}</span>
      {children}
    </span>
  );
}
