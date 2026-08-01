import { useState } from "react";

import { StudioSidebar } from "../components/layout/StudioSidebar";
import { StudioTopbar } from "../components/layout/StudioTopbar";

import {
  CreateProjectDialog,
  type CreateSeriesDialogInput,
} from "../features/projects/CreateProjectDialog";

import { useProjects } from "../features/projects/useProjects";

import "../features/projects/create-project-dialog.css";

type StudioView = "library" | "settings";

export function StudioShell() {
  const [activeView, setActiveView] =
    useState<StudioView>("library");

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const [isCreateDialogOpen, setIsCreateDialogOpen] =
    useState(false);

  const [isCreatingProject, setIsCreatingProject] =
    useState(false);

  const {
    projects,
    isLoading,
    error,
    createSeries,
  } = useProjects();

  function openCreateProjectDialog(): void {
    setActiveView("library");
    setIsCreateDialogOpen(true);
  }

  function closeCreateProjectDialog(): void {
    if (isCreatingProject) {
      return;
    }

    setIsCreateDialogOpen(false);
  }

  async function handleCreateSeries(
    input: CreateSeriesDialogInput,
  ) {
    setIsCreatingProject(true);

    try {
      return await createSeries(input);
    } finally {
      setIsCreatingProject(false);
    }
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
        activeView={activeView}
        projects={projects}
        isLoadingProjects={isLoading}
        onShowLibrary={() => {
          setActiveView("library");
        }}
        onShowSettings={() => {
          setActiveView("settings");
        }}
        onCreateProject={
          openCreateProjectDialog
        }
      />

      <div className="studio-main">
        <StudioTopbar
          title={
            activeView === "library"
              ? "مكتبة المشاريع"
              : "الإعدادات"
          }
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => {
            setSidebarCollapsed(
              (currentValue) => !currentValue,
            );
          }}
        />

        <section className="studio-workspace">
          {activeView === "library" ? (
            <LibraryView
              projectCount={projects.length}
              isLoading={isLoading}
              onCreateProject={
                openCreateProjectDialog
              }
            />
          ) : (
            <SettingsPlaceholder />
          )}
        </section>
      </div>

      <CreateProjectDialog
        isOpen={isCreateDialogOpen}
        isSubmitting={isCreatingProject}
        error={error}
        onClose={closeCreateProjectDialog}
        onCreateSeries={handleCreateSeries}
      />
    </div>
  );
}

interface LibraryViewProps {
  projectCount: number;
  isLoading: boolean;
  onCreateProject: () => void;
}

function LibraryView({
  projectCount,
  isLoading,
  onCreateProject,
}: LibraryViewProps) {
  const hasProjects = projectCount > 0;

  return (
    <main className="library-view">
      <header className="library-heading">
        <div>
          <h1>مكتبة المشاريع</h1>

          <p>
            {isLoading
              ? "جارٍ تحميل المشاريع..."
              : formatProjectCount(projectCount)}
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={onCreateProject}
        >
          مشروع جديد
        </button>
      </header>

      {!hasProjects && !isLoading && (
        <section className="library-empty-state">
          <div className="empty-state-mark">
            SW
          </div>

          <h2>لا توجد مشاريع بعد</h2>

          <p>
            أنشئ مشروعك الأول، ثم ابدأ بناء
            الحكاية والشخصيات والحلقات والمشاهد.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={onCreateProject}
          >
            إنشاء أول مشروع
          </button>
        </section>
      )}

      {hasProjects && (
        <section className="library-empty-state">
          <div className="empty-state-mark">
            {projectCount}
          </div>

          <h2>مشاريعك محفوظة محليًا</h2>

          <p>
            اختر مشروعًا من الشريط الجانبي،
            أو أنشئ مشروعًا جديدًا.
          </p>
        </section>
      )}
    </main>
  );
}

function SettingsPlaceholder() {
  return (
    <main className="settings-view">
      <div className="settings-card">
        <div className="settings-mark">إ</div>

        <h1>إعدادات التطبيق</h1>

        <p>
          ستضم هذه المساحة إعدادات اللغة
          والمظهر والحفظ والطباعة والتصدير.
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