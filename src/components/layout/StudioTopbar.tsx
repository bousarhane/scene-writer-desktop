interface StudioTopbarProps {
  title: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function StudioTopbar({
  title,
  sidebarCollapsed,
  onToggleSidebar,
}: StudioTopbarProps) {
  return (
    <header className="studio-topbar">
      <div className="topbar-title-group">
        <button
          type="button"
          className="topbar-menu-button"
          aria-label={
            sidebarCollapsed
              ? "إظهار الشريط الجانبي"
              : "إخفاء الشريط الجانبي"
          }
          title={
            sidebarCollapsed
              ? "إظهار الشريط الجانبي"
              : "إخفاء الشريط الجانبي"
          }
          onClick={onToggleSidebar}
        >
          ☰
        </button>

        <div>
          <h1>{title}</h1>
          <p>Scene Writer</p>
        </div>
      </div>

      <div className="local-save-status">
        <span className="local-save-dot" />
        <span>الحفظ المحلي مفعّل</span>
      </div>
    </header>
  );
}