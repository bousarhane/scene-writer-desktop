interface StudioSidebarProps {
  activeView: "library" | "settings";

  onShowLibrary: () => void;
  onShowSettings: () => void;
  onCreateProject: () => void;
}

export function StudioSidebar({
  activeView,
  onShowLibrary,
  onShowSettings,
  onCreateProject,
}: StudioSidebarProps) {
  return (
    <aside className="studio-sidebar">
      <button
        type="button"
        className="studio-brand"
        onClick={onShowLibrary}
      >
        <span className="studio-brand-mark">
          SW
        </span>

        <span className="studio-brand-copy">
          <strong>Scene Writer</strong>
          <small>استوديو الكتابة</small>
        </span>
      </button>

      <div className="sidebar-library">
        <button
          type="button"
          className="sidebar-create-button"
          onClick={onCreateProject}
        >
          <span aria-hidden="true">＋</span>
          <span>مشروع جديد</span>
        </button>

        <div className="sidebar-section-title">
          <span>المشاريع</span>
          <strong>0</strong>
        </div>

        <div className="sidebar-empty-projects">
          لا توجد مشاريع بعد
        </div>
      </div>

      <div className="sidebar-spacer" />

      <button
        type="button"
        className={
          activeView === "settings"
            ? "sidebar-settings is-active"
            : "sidebar-settings"
        }
        onClick={onShowSettings}
      >
        <span className="sidebar-settings-icon">
          إ
        </span>

        <span>الإعدادات</span>
      </button>

      <footer className="sidebar-footer">
        <span>الإصدار التجريبي</span>
        <strong>0.1.0</strong>
      </footer>
    </aside>
  );
}