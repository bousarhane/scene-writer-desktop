import type {
  Project,
  ProjectType,
} from "../../types";

import type {
  ProjectWorkspaceSection,
} from "../../features/projects/ProjectWorkspace";

type StudioSidebarMode =
  | "library"
  | "project";

interface StudioSidebarProps {
  mode: StudioSidebarMode;

  activeView:
    | "library"
    | "settings"
    | "project";

  projects: Project[];
  isLoadingProjects: boolean;

  currentProject: Project | null;

  activeProjectSection:
    ProjectWorkspaceSection;

  onShowLibrary: () => void;
  onShowSettings: () => void;
  onCreateProject: () => void;

  onOpenProject: (
    projectId: string,
  ) => void;

  onSelectProjectSection: (
    section: ProjectWorkspaceSection,
  ) => void;
}

export function StudioSidebar({
  mode,
  activeView,
  projects,
  isLoadingProjects,
  currentProject,
  activeProjectSection,
  onShowLibrary,
  onShowSettings,
  onCreateProject,
  onOpenProject,
  onSelectProjectSection,
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

      {mode === "library" ? (
        <LibrarySidebarContent
          projects={projects}
          isLoadingProjects={
            isLoadingProjects
          }
          onCreateProject={
            onCreateProject
          }
          onOpenProject={
            onOpenProject
          }
        />
      ) : (
        <ProjectSidebarContent
          project={currentProject}
          activeSection={
            activeProjectSection
          }
          onBackToLibrary={
            onShowLibrary
          }
          onSelectSection={
            onSelectProjectSection
          }
        />
      )}

      <div className="sidebar-spacer" />

      {mode === "library" && (
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
      )}

      <footer className="sidebar-footer">
        <span>الإصدار التجريبي</span>
        <strong>0.1.0</strong>
      </footer>
    </aside>
  );
}

interface LibrarySidebarContentProps {
  projects: Project[];
  isLoadingProjects: boolean;

  onCreateProject: () => void;

  onOpenProject: (
    projectId: string,
  ) => void;
}

function LibrarySidebarContent({
  projects,
  isLoadingProjects,
  onCreateProject,
  onOpenProject,
}: LibrarySidebarContentProps) {
  return (
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
              onClick={() => {
                onOpenProject(project.id);
              }}
            >
              <span className="sidebar-project-letter">
                {getProjectInitial(
                  project.title,
                )}
              </span>

              <span className="sidebar-project-copy">
                <strong>
                  {project.title}
                </strong>

                <small>
                  {formatProjectDescription(
                    project,
                  )}
                </small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ProjectSidebarContentProps {
  project: Project | null;

  activeSection:
    ProjectWorkspaceSection;

  onBackToLibrary: () => void;

  onSelectSection: (
    section: ProjectWorkspaceSection,
  ) => void;
}

function ProjectSidebarContent({
  project,
  activeSection,
  onBackToLibrary,
  onSelectSection,
}: ProjectSidebarContentProps) {
  if (project === null) {
    return (
      <div className="sidebar-empty-projects">
        جارٍ فتح المشروع...
      </div>
    );
  }

  const navigationItems =
    getProjectNavigationItems(
      project.projectType,
    );

  return (
    <>
      <div className="sidebar-project-header">
        <button
          type="button"
          className="sidebar-back-button"
          onClick={onBackToLibrary}
        >
          <span aria-hidden="true">
            ←
          </span>

          <span>
            العودة إلى المكتبة
          </span>
        </button>

        <div className="sidebar-current-project">
          <span className="sidebar-current-project-mark">
            {getProjectInitial(
              project.title,
            )}
          </span>

          <span className="sidebar-current-project-copy">
            <strong>
              {project.title}
            </strong>

            <small>
              {getProjectTypeLabel(
                project.projectType,
              )}
            </small>
          </span>
        </div>
      </div>

      <nav
        className="sidebar-project-navigation"
        aria-label="أقسام المشروع"
      >
        {navigationItems.map((item) => {
          const isActive =
            activeSection === item.section;

          return (
            <button
              key={item.section}
              type="button"
              className={
                isActive
                  ? "sidebar-project-navigation-button is-active"
                  : "sidebar-project-navigation-button"
              }
              onClick={() => {
                onSelectSection(
                  item.section,
                );
              }}
            >
              <span className="sidebar-project-navigation-symbol">
                {item.symbol}
              </span>

              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

interface ProjectNavigationItem {
  section: ProjectWorkspaceSection;
  label: string;
  symbol: string;
}

function getProjectNavigationItems(
  projectType: ProjectType,
): ProjectNavigationItem[] {
  return [
    {
      section: "dashboard",
      label: "لوحة المشروع",
      symbol: "ل",
    },
    {
      section: "story",
      label: "الحكاية",
      symbol: "ح",
    },
    {
      section: "characters",
      label: "الشخصيات",
      symbol: "ش",
    },
    {
      section: "locations",
      label: "الأماكن",
      symbol: "أ",
    },
    {
      section: "structure",
      label:
        projectType === "series"
          ? "المواسم والحلقات"
          : projectType ===
              "stage_play"
            ? "بنية المسرحية"
            : "بنية العمل",
      symbol: "ب",
    },
    {
      section: "scenes",
      label: "المشاهد",
      symbol: "م",
    },
    {
      section: "documents",
      label: "الوثائق",
      symbol: "و",
    },
    {
      section: "export",
      label: "التصدير",
      symbol: "ت",
    },
    {
      section: "project-settings",
      label: "إعدادات المشروع",
      symbol: "إ",
    },
  ];
}

function getProjectInitial(
  title: string,
): string {
  const normalizedTitle =
    title.trim();

  return normalizedTitle
    ? normalizedTitle.charAt(0)
    : "م";
}

function formatProjectDescription(
  project: Project,
): string {
  if (
    project.projectType === "series"
  ) {
    const episodeCount =
      project.plannedEpisodeCount ?? "—";

    return `${episodeCount} حلقة`;
  }

  return getProjectTypeLabel(
    project.projectType,
  );
}

function getProjectTypeLabel(
  projectType: ProjectType,
): string {
  switch (projectType) {
    case "series":
      return "مسلسل تلفزيوني";

    case "film":
      return "فيلم سينمائي";

    case "short_film":
      return "فيلم قصير";

    case "single_episode":
      return "حلقة منفردة";

    case "stage_play":
      return "مسرحية";
  }
}