
import {
  useCallback,
  useState,
} from "react";

import {
  StudioSidebar,
} from "../components/layout/StudioSidebar";

import {
  StudioTopbar,
} from "../components/layout/StudioTopbar";

import {
  CreateProjectDialog,
  type CreateProjectDialogInput,
} from "../features/projects/CreateProjectDialog";

import {
  ProjectWorkspace,
  type ProjectWorkspaceSection,
} from "../features/projects/ProjectWorkspace";

import {
  useProjects,
} from "../features/projects/useProjects";

import type {
  Project,
  ProjectType,
} from "../types";

import "../features/projects/create-project-dialog.css";
import "../features/projects/project-workspace.css";

type StudioView =
  | "library"
  | "settings"
  | "project";

export function StudioShell() {
  const [
    activeView,
    setActiveView,
  ] = useState<StudioView>(
    "library",
  );

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState<string | null>(
    null,
  );

  const [
    currentProject,
    setCurrentProject,
  ] = useState<Project | null>(
    null,
  );

  const [
    projectOverrides,
    setProjectOverrides,
  ] = useState<Record<string, Project>>(
    {},
  );

  const [
    activeProjectSection,
    setActiveProjectSection,
  ] =
    useState<ProjectWorkspaceSection>(
      "dashboard",
    );

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false);

  const [
    isCreateDialogOpen,
    setIsCreateDialogOpen,
  ] = useState(false);

  const [
    isCreatingProject,
    setIsCreatingProject,
  ] = useState(false);

  const [
    projectPendingDelete,
    setProjectPendingDelete,
  ] = useState<Project | null>(
    null,
  );

  const [
    isDeletingProject,
    setIsDeletingProject,
  ] = useState(false);

  const {
    projects,
    isLoading,
    error,
    createProject,
    deleteProject,
  } = useProjects();

  const displayedProjects =
    projects.map((project) =>
      projectOverrides[project.id] ??
      project,
    );

  function showLibrary(): void {
    setSelectedProjectId(null);
    setCurrentProject(null);

    setActiveProjectSection(
      "dashboard",
    );

    setActiveView("library");
  }

  function showSettings(): void {
    setSelectedProjectId(null);
    setCurrentProject(null);

    setActiveView("settings");
  }

  function openProject(
    projectId: string,
  ): void {
    const project =
      displayedProjects.find(
        (candidate) =>
          candidate.id === projectId,
      ) ?? null;

    setSelectedProjectId(projectId);
    setCurrentProject(project);

    setActiveProjectSection(
      "dashboard",
    );

    setActiveView("project");
  }

  const handleProjectLoaded =
    useCallback(
      (
        loadedProject: Project,
      ): void => {
        setCurrentProject(
          loadedProject,
        );

        setProjectOverrides((current) => ({
          ...current,
          [loadedProject.id]: loadedProject,
        }));
      },
      [],
    );

  function openCreateProjectDialog():
    void {
    setActiveView("library");

    setIsCreateDialogOpen(true);
  }

  function closeCreateProjectDialog():
    void {
    if (isCreatingProject) {
      return;
    }

    setIsCreateDialogOpen(false);
  }

  async function handleCreateProject(
    input:
      CreateProjectDialogInput,
  ): Promise<Project | null> {
    setIsCreatingProject(true);

    try {
      const project =
        await createProject(input);

      if (project !== null) {
        setSelectedProjectId(
          project.id,
        );

        setCurrentProject(project);

        setActiveProjectSection(
          project.projectType === "series" ||
          project.projectType === "single_episode"
            ? "structure"
            : "story",
        );

        setActiveView("project");
      }

      return project;
    } finally {
      setIsCreatingProject(false);
    }
  }

  function requestProjectDeletion(
    project: Project,
  ): void {
    setProjectPendingDelete(
      project,
    );
  }

  function cancelProjectDeletion():
    void {
    if (isDeletingProject) {
      return;
    }

    setProjectPendingDelete(
      null,
    );
  }

  async function confirmProjectDeletion():
    Promise<void> {
    if (
      projectPendingDelete === null ||
      isDeletingProject
    ) {
      return;
    }

    setIsDeletingProject(true);

    try {
      await deleteProject(
        projectPendingDelete.id,
      );

      if (
        selectedProjectId ===
        projectPendingDelete.id
      ) {
        showLibrary();
      }

      setProjectPendingDelete(
        null,
      );
    } finally {
      setIsDeletingProject(false);
    }
  }

  function getTopbarTitle():
    string {
    if (
      activeView === "settings"
    ) {
      return "الإعدادات";
    }

    if (
      activeView === "project"
    ) {
      return (
        currentProject?.title ??
        "المشروع"
      );
    }

    return "مكتبة المشاريع";
  }

  return (
    <div
      className={
        sidebarCollapsed
          ? "studio-shell studio-shell--sidebar-collapsed"
          : "studio-shell"
      }
      dir="rtl"
    >
      <StudioSidebar
        mode={
          activeView === "project"
            ? "project"
            : "library"
        }
        activeView={activeView}
        currentProject={
          currentProject
        }
        activeProjectSection={
          activeProjectSection
        }
        onShowLibrary={
          showLibrary
        }
        onShowSettings={
          showSettings
        }
        onCreateProject={
          openCreateProjectDialog
        }
        onSelectProjectSection={
          setActiveProjectSection
        }
      />

      <div className="studio-main">
        <StudioTopbar
          title={getTopbarTitle()}
          sidebarCollapsed={
            sidebarCollapsed
          }
          onToggleSidebar={() => {
            setSidebarCollapsed(
              (currentValue) =>
                !currentValue,
            );
          }}
        />

        <section className="studio-workspace">
          {activeView ===
            "library" && (
            <LibraryView
              projects={displayedProjects}
              isLoading={isLoading}
              error={error}
              onCreateProject={
                openCreateProjectDialog
              }
              onOpenProject={
                openProject
              }
              onDeleteProject={
                requestProjectDeletion
              }
            />
          )}

          {activeView ===
            "settings" && (
            <SettingsPlaceholder />
          )}

          {activeView ===
            "project" &&
            selectedProjectId !==
              null && (
              <ProjectWorkspace
                projectId={
                  selectedProjectId
                }
                activeSection={
                  activeProjectSection
                }
                onProjectLoaded={
                  handleProjectLoaded
                }
                onBackToLibrary={
                  showLibrary
                }
                onSelectProjectSection={
                  setActiveProjectSection
                }
              />
            )}
        </section>
      </div>

      <CreateProjectDialog
        isOpen={
          isCreateDialogOpen
        }
        isSubmitting={
          isCreatingProject
        }
        error={error}
        onClose={
          closeCreateProjectDialog
        }
        onCreateProject={
          handleCreateProject
        }
      />

      {projectPendingDelete !==
        null && (
        <DeleteProjectDialog
          project={
            projectPendingDelete
          }
          isDeleting={
            isDeletingProject
          }
          onCancel={
            cancelProjectDeletion
          }
          onConfirm={() => {
            void confirmProjectDeletion();
          }}
        />
      )}
    </div>
  );
}

interface LibraryViewProps {
  projects: Project[];
  isLoading: boolean;
  error: string | null;

  onCreateProject:
    () => void;

  onOpenProject:
    (projectId: string) => void;

  onDeleteProject:
    (project: Project) => void;
}

function LibraryView({
  projects,
  isLoading,
  error,
  onCreateProject,
  onOpenProject,
  onDeleteProject,
}: LibraryViewProps) {
  const [
    openActionsProjectId,
    setOpenActionsProjectId,
  ] = useState<string | null>(
    null,
  );

  const hasProjects =
    projects.length > 0;

  return (
    <main className="library-view">
      <header className="library-heading">
        <div>
          <h1>
            مكتبة المشاريع
          </h1>

          <p>
            {isLoading
              ? "جارٍ تحميل المشاريع..."
              : formatProjectCount(
                  projects.length,
                )}
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={
            onCreateProject
          }
        >
          مشروع جديد
        </button>
      </header>

      {error !== null && (
        <div
          className="project-library-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {!hasProjects &&
        !isLoading && (
          <section className="library-empty-state">
            <div className="empty-state-mark">
              SW
            </div>

            <h2>
              ابدأ مشروعك الأول
            </h2>

            <p>
              حدد نوع العمل، وابن
              حكايته وشخصياته، ثم
              انتقل إلى التحرير.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={
                onCreateProject
              }
            >
              إنشاء أول مشروع
            </button>
          </section>
        )}

      {hasProjects && (
        <section
          className="project-library-grid"
          aria-label="المشاريع المحفوظة"
        >
          {projects.map(
            (project) => {
              const isActionsOpen =
                openActionsProjectId ===
                project.id;

              return (
                <article
                  key={project.id}
                  className="project-library-card"
                >
                  <div className="project-library-card-topline">
                    <span className="project-library-type">
                      {getProjectTypeLabel(
                        project.projectType,
                      )}
                    </span>

                    <div className="project-library-actions">
                      <button
                        type="button"
                        className="project-library-actions-trigger"
                        aria-label={`إجراءات مشروع ${project.title}`}
                        aria-expanded={
                          isActionsOpen
                        }
                        onClick={() => {
                          setOpenActionsProjectId(
                            isActionsOpen
                              ? null
                              : project.id,
                          );
                        }}
                      >
                        ⋮
                      </button>

                      {isActionsOpen && (
                        <div
                          className="project-library-actions-menu"
                          role="menu"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenActionsProjectId(
                                null,
                              );

                              onOpenProject(
                                project.id,
                              );
                            }}
                          >
                            فتح المشروع
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            className="is-danger"
                            onClick={() => {
                              setOpenActionsProjectId(
                                null,
                              );

                              onDeleteProject(
                                project,
                              );
                            }}
                          >
                            حذف المشروع
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="project-library-card-main"
                    onClick={() => {
                      onOpenProject(
                        project.id,
                      );
                    }}
                  >
                    <span className="project-library-mark">
                      {getProjectInitial(
                        project.title,
                      )}
                    </span>

                    <span className="project-library-copy">
                      <strong>
                        {project.title}
                      </strong>

                      <small>
                        {project.subtitle ||
                          project.description ||
                          "مشروع محفوظ محليًا"}
                      </small>
                    </span>
                  </button>

                  <div className="project-library-meta">
                    <span>
                      {formatProjectDetails(
                        project,
                      )}
                    </span>

                    <span>
                      {formatProjectDate(
                        project.lastOpenedAt ??
                          project.updatedAt ??
                          project.createdAt,
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="project-library-open"
                    onClick={() => {
                      onOpenProject(
                        project.id,
                      );
                    }}
                  >
                    فتح المشروع
                  </button>
                </article>
              );
            },
          )}
        </section>
      )}
    </main>
  );
}

interface DeleteProjectDialogProps {
  project: Project;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteProjectDialog({
  project,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteProjectDialogProps) {
  const [
    confirmationText,
    setConfirmationText,
  ] = useState("");

  const isConfirmed =
    confirmationText.trim() ===
    project.title.trim();

  return (
    <div
      className="delete-project-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onCancel();
        }
      }}
    >
      <section
        className="delete-project-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-project-title"
        dir="rtl"
      >
        <header>
          <div>
            <span>
              إجراء نهائي
            </span>

            <h2 id="delete-project-title">
              حذف المشروع
            </h2>
          </div>

          <button
            type="button"
            aria-label="إغلاق"
            disabled={isDeleting}
            onClick={onCancel}
          >
            ×
          </button>
        </header>

        <div className="delete-project-dialog-body">
          <p>
            سيُحذف مشروع{" "}
            <strong>
              «{project.title}»
            </strong>{" "}
            مع جميع مواسمه وحلقاته
            ومشاهده ونصوصه وشخصياته
            وأماكنه.
          </p>

          <p className="delete-project-warning">
            لا يمكن التراجع عن هذا
            الإجراء بعد تنفيذه.
          </p>

          <label>
            <span>
              اكتب اسم المشروع للتأكيد:
            </span>

            <strong>
              {project.title}
            </strong>

            <input
              type="text"
              autoFocus
              value={
                confirmationText
              }
              disabled={isDeleting}
              onChange={(event) => {
                setConfirmationText(
                  event.target.value,
                );
              }}
            />
          </label>
        </div>

        <footer>
          <button
            type="button"
            className="delete-project-cancel"
            disabled={isDeleting}
            onClick={onCancel}
          >
            إلغاء
          </button>

          <button
            type="button"
            className="delete-project-confirm"
            disabled={
              !isConfirmed ||
              isDeleting
            }
            onClick={onConfirm}
          >
            {isDeleting
              ? "جارٍ حذف المشروع..."
              : "حذف المشروع نهائيًا"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function SettingsPlaceholder() {
  return (
    <main className="settings-view">
      <div className="settings-card">
        <div className="settings-mark">
          إ
        </div>

        <h1>
          إعدادات التطبيق
        </h1>

        <p>
          ستضم هذه المساحة إعدادات
          اللغة والمظهر والحفظ
          والطباعة والتصدير.
        </p>
      </div>
    </main>
  );
}

function formatProjectCount(
  projectCount: number,
): string {
  if (projectCount === 0) {
    return "لا توجد مشاريع محفوظة حاليًا.";
  }

  if (projectCount === 1) {
    return "يوجد مشروع واحد محفوظ.";
  }

  return `يوجد ${projectCount} مشاريع محفوظة.`;
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

function getProjectStatusLabel(
  status: string,
): string {
  switch (status) {
    case "draft":
      return "مسودة";

    case "in_progress":
      return "قيد الإنجاز";

    case "completed":
      return "مكتمل";

    case "archived":
      return "مؤرشف";

    default:
      return status;
  }
}

function formatProjectDetails(
  project: Project,
): string {
  if (
    project.projectType === "series"
  ) {
    const episodeCount =
      project.plannedEpisodeCount ??
      "—";

    if (
      project.seriesStructure ===
      "multi_season"
    ) {
      const seasonCount =
        project.plannedSeasonCount ??
        "—";

      return `${seasonCount} موسم · ${episodeCount} حلقة`;
    }

    return `${episodeCount} حلقة`;
  }

  if (
    project.projectType ===
    "single_episode"
  ) {
    const duration =
      project
        .defaultEpisodeDurationMinutes;

    return duration === null
      ? "حلقة منفردة"
      : `${duration} دقيقة`;
  }

  const duration =
    project
      .defaultEpisodeDurationMinutes;

  const minimumScenes =
    project
      .defaultMinimumScenesPerEpisode;

  const maximumScenes =
    project
      .defaultMaximumScenesPerEpisode;

  const parts: string[] = [];

  if (duration !== null) {
    parts.push(
      `${duration} دقيقة`,
    );
  }

  if (
    minimumScenes !== null &&
    maximumScenes !== null
  ) {
    parts.push(
      `${minimumScenes}–${maximumScenes} مشهدًا`,
    );
  }

  return parts.length > 0
    ? parts.join(" · ")
    : getProjectTypeLabel(
        project.projectType,
      );
}

function formatProjectDate(
  value: string | null,
): string {
  if (value === null) {
    return "لم يُفتح بعد";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "ar-MA",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(date);
}
