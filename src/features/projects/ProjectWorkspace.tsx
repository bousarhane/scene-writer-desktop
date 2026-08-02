import {
  CharactersWorkspace,
} from "../characters/CharactersWorkspace";import {
  useEffect,
  useState,
} from "react";

import {
  projectService,
} from "../../application";

import type {
  Project,
  ProjectType,
} from "../../types";

import {
  ProjectStoryEditor,
} from "../stories/ProjectStoryEditor";

export type ProjectWorkspaceSection =
  | "dashboard"
  | "story"
  | "characters"
  | "locations"
  | "structure"
  | "scenes"
  | "documents"
  | "export"
  | "project-settings";

interface ProjectWorkspaceProps {
  projectId: string;

  activeSection:
    ProjectWorkspaceSection;

  onProjectLoaded: (
    project: Project,
  ) => void;

  onBackToLibrary: () => void;
}

export function ProjectWorkspace({
  projectId,
  activeSection,
  onProjectLoaded,
  onBackToLibrary,
}: ProjectWorkspaceProps) {
  const [project, setProject] =
    useState<Project | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadProject():
      Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const loadedProject =
          await projectService.getProject(
            projectId,
          );

        if (isCancelled) {
          return;
        }

        if (loadedProject === null) {
          setProject(null);
          return;
        }

        const openedProject =
          await projectService
            .markProjectAsOpened(
              loadedProject.id,
            );

        if (isCancelled) {
          return;
        }

        setProject(openedProject);

        onProjectLoaded(
          openedProject,
        );
      } catch (caughtError) {
        if (isCancelled) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : String(caughtError),
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProject();

    return () => {
      isCancelled = true;
    };
  }, [
    projectId,
    onProjectLoaded,
  ]);

  if (isLoading) {
    return (
      <WorkspaceState>
        جارٍ فتح المشروع...
      </WorkspaceState>
    );
  }

  if (error !== null) {
    return (
      <WorkspaceState>
        <h2>
          تعذر فتح المشروع
        </h2>

        <p>{error}</p>

        <button
          type="button"
          className="primary-button"
          onClick={onBackToLibrary}
        >
          العودة إلى المكتبة
        </button>
      </WorkspaceState>
    );
  }

  if (project === null) {
    return (
      <WorkspaceState>
        <h2>
          المشروع غير موجود
        </h2>

        <p>
          قد يكون المشروع قد حُذف
          أو لم يعد متاحًا في قاعدة
          البيانات المحلية.
        </p>

        <button
          type="button"
          className="primary-button"
          onClick={onBackToLibrary}
        >
          العودة إلى المكتبة
        </button>
      </WorkspaceState>
    );
  }

  if (
    activeSection === "dashboard"
  ) {
    return (
      <ProjectDashboard
        project={project}
      />
    );
  }

  if (
    activeSection === "story"
  ) {
    return (
      <ProjectStoryEditor
        project={project}
      />
    );
  }
if (
  activeSection === "characters"
) {
  return (
    <CharactersWorkspace
      project={project}
    />
  );
}
  return (
    <ProjectSectionPlaceholder
      project={project}
      section={activeSection}
    />
  );
}

interface WorkspaceStateProps {
  children: React.ReactNode;
}

function WorkspaceState({
  children,
}: WorkspaceStateProps) {
  return (
    <main
      className="project-workspace-state"
      dir="rtl"
    >
      {children}
    </main>
  );
}

interface ProjectDashboardProps {
  project: Project;
}

function ProjectDashboard({
  project,
}: ProjectDashboardProps) {
  return (
    <main
      className="project-dashboard"
      dir="rtl"
    >
      <header className="project-dashboard-header">
        <div>
          <span className="project-dashboard-type">
            {getProjectTypeLabel(
              project.projectType,
            )}
          </span>

          <h1>
            {project.title}
          </h1>

          <p>
            لوحة المشروع الرئيسية
            ومعلوماته الأساسية.
          </p>
        </div>

        <div className="project-dashboard-status">
          <span>
            حالة المشروع
          </span>

          <strong>
            {getProjectStatusLabel(
              project.status,
            )}
          </strong>
        </div>
      </header>

      <section className="project-dashboard-stats">
        {getProjectStatistics(
          project,
        ).map((statistic) => (
          <article
            key={statistic.label}
            className="project-stat-card"
          >
            <span>
              {statistic.label}
            </span>

            <strong>
              {statistic.value}
            </strong>
          </article>
        ))}
      </section>

      <section className="project-dashboard-panel">
        <div>
          <span className="project-panel-kicker">
            نقطة البداية
          </span>

          <h2>
            ابدأ بناء العمل الدرامي
          </h2>

          <p>
            يمكن الانتقال من الشريط
            الجانبي إلى الحكاية
            والشخصيات والأماكن وبنية
            العمل والمشاهد.
          </p>
        </div>
      </section>
    </main>
  );
}

interface ProjectSectionPlaceholderProps {
  project: Project;

  section:
    ProjectWorkspaceSection;
}

function ProjectSectionPlaceholder({
  project,
  section,
}: ProjectSectionPlaceholderProps) {
  const sectionInformation =
    getSectionInformation(
      section,
      project.projectType,
    );

  return (
    <main
      className="project-section-placeholder"
      dir="rtl"
    >
      <div className="project-section-symbol">
        {sectionInformation.symbol}
      </div>

      <span className="project-section-project-name">
        {project.title}
      </span>

      <h1>
        {sectionInformation.title}
      </h1>

      <p>
        {
          sectionInformation.description
        }
      </p>

      <span className="project-section-coming-soon">
        ستُبنى هذه الوحدة في المرحلة
        القادمة.
      </span>
    </main>
  );
}

interface ProjectStatistic {
  label: string;
  value: string;
}

function getProjectStatistics(
  project: Project,
): ProjectStatistic[] {
  const duration =
    project
      .defaultEpisodeDurationMinutes;

  const sceneRange =
    formatSceneRange(project);

  if (
    project.projectType === "series"
  ) {
    return [
      {
        label: "عدد المواسم",
        value: String(
          project
            .plannedSeasonCount ??
            "—",
        ),
      },
      {
        label: "عدد الحلقات",
        value: String(
          project
            .plannedEpisodeCount ??
            "—",
        ),
      },
      {
        label: "مدة الحلقة",
        value:
          duration === null
            ? "—"
            : `${duration} دقيقة`,
      },
      {
        label: "مشاهد الحلقة",
        value: sceneRange,
      },
    ];
  }

  if (
    project.projectType ===
    "single_episode"
  ) {
    return [
      {
        label: "نوع العمل",
        value: "حلقة مستقلة",
      },
      {
        label: "المدة",
        value:
          duration === null
            ? "—"
            : `${duration} دقيقة`,
      },
      {
        label: "عدد الحلقات",
        value: "1",
      },
      {
        label: "عدد المشاهد",
        value: sceneRange,
      },
    ];
  }

  return [
    {
      label: "نوع العمل",
      value: getProjectTypeLabel(
        project.projectType,
      ),
    },
    {
      label: "المدة المستهدفة",
      value:
        duration === null
          ? "—"
          : `${duration} دقيقة`,
    },
    {
      label: "عدد المشاهد",
      value: sceneRange,
    },
    {
      label: "تاريخ الإنشاء",
      value: formatDate(
        project.createdAt,
      ),
    },
  ];
}

function formatSceneRange(
  project: Project,
): string {
  const minimum =
    project
      .defaultMinimumScenesPerEpisode;

  const maximum =
    project
      .defaultMaximumScenesPerEpisode;

  if (
    minimum === null &&
    maximum === null
  ) {
    return "—";
  }

  if (
    minimum !== null &&
    maximum !== null
  ) {
    return `${minimum} – ${maximum}`;
  }

  return String(
    minimum ?? maximum,
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

function getProjectStatusLabel(
  status: Project["status"],
): string {
  switch (status) {
    case "draft":
      return "مسودة";

    case "in_progress":
      return "قيد الإنجاز";

    case "review":
      return "قيد المراجعة";

    case "completed":
      return "مكتمل";

    case "archived":
      return "مؤرشف";
  }
}

interface SectionInformation {
  title: string;
  description: string;
  symbol: string;
}

function getSectionInformation(
  section:
    ProjectWorkspaceSection,

  projectType: ProjectType,
): SectionInformation {
  switch (section) {
    case "dashboard":
      return {
        title: "لوحة المشروع",
        description:
          "المعلومات الأساسية للمشروع.",
        symbol: "ل",
      };

    case "story":
      return {
        title: "الحكاية",
        description:
          "فضاء بناء الفكرة والحكاية والملخص والخطوط الدرامية.",
        symbol: "ح",
      };

    case "characters":
      return {
        title: "الشخصيات",
        description:
          "إدارة الشخصيات وملامحها ووظائفها وعلاقاتها.",
        symbol: "ش",
      };

    case "locations":
      return {
        title: "الأماكن",
        description:
          "إنشاء أماكن العمل ووصفها وربطها بالمشاهد.",
        symbol: "أ",
      };

    case "structure":
      return {
        title:
          projectType === "series"
            ? "المواسم والحلقات"
            : projectType ===
                "stage_play"
              ? "بنية المسرحية"
              : "بنية العمل",

        description:
          projectType === "series"
            ? "تنظيم المواسم والحلقات وترتيبها."
            : "تنظيم الأجزاء البنيوية للعمل الدرامي.",

        symbol: "ب",
      };

    case "scenes":
      return {
        title: "المشاهد",
        description:
          "إنشاء المشاهد وترتيبها وكتابتها.",
        symbol: "م",
      };

    case "documents":
      return {
        title: "الوثائق",
        description:
          "حفظ الملاحظات والمواد المرجعية المرتبطة بالمشروع.",
        symbol: "و",
      };

    case "export":
      return {
        title: "التصدير",
        description:
          "إعداد العمل للطباعة أو التصدير إلى الصيغ المختلفة.",
        symbol: "ت",
      };

    case "project-settings":
      return {
        title: "إعدادات المشروع",
        description:
          "إدارة خصائص المشروع وتفضيلاته.",
        symbol: "إ",
      };
  }
}

function formatDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "ar-MA",
    {
      dateStyle: "medium",
    },
  ).format(
    new Date(value),
  );
}