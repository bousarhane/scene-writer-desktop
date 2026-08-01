import type { Project } from "../../types";

interface StudioSidebarProps {
  activeView: "library" | "settings";

  projects: Project[];
  isLoadingProjects: boolean;

  onShowLibrary: () => void;
  onShowSettings: () => void;
  onCreateProject: () => void;
}

export function StudioSidebar({
  activeView,
  projects,
  isLoadingProjects,
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
          <strong>{projects.length}</strong>
        </div>

        {isLoadingProjects ? (
          <div className="sidebar-empty-projects">
            جارٍ تحميل المشاريع...
          </div>
        ) : projects.length === 0 ? (
          <div className="sidebar-empty-projects">
            لا توجد مشاريع بعد
          </div>
        ) : (
          <div className="sidebar-project-list">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                className="sidebar-project-button"
                title={project.title}
                onClick={onShowLibrary}
              >
                <span className="sidebar-project-letter">
                  {getProjectInitial(project.title)}
                </span>

                <span className="sidebar-project-copy">
                  <strong>{project.title}</strong>

                  <small>
                    {formatProjectDescription(project)}
                  </small>
                </span>
              </button>
            ))}
          </div>
        )}
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

function getProjectInitial(
  title: string,
): string {
  const normalizedTitle = title.trim();

  return normalizedTitle
    ? normalizedTitle.charAt(0)
    : "م";
}

function formatProjectDescription(
  project: Project,
): string {
  if (project.projectType === "series") {
    const episodeCount =
      project.plannedEpisodeCount ?? "—";

    return `${episodeCount} حلقة`;
  }

  switch (project.projectType) {
    case "film":
      return "فيلم";

    case "short_film":
      return "فيلم قصير";

    case "single_episode":
      return "حلقة منفردة";

    case "stage_play":
      return "مسرحية";

    default:
      return "مشروع درامي";
  }
}