interface AppHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function AppHeader({ title, action }: AppHeaderProps) {
  return (
    <header className="cmp-topbar">
      <div className="cmp-topbar-left">
        <h1 className="cmp-topbar-title">{title}</h1>
      </div>
      {action && <div className="cmp-topbar-actions">{action}</div>}
    </header>
  );
}
