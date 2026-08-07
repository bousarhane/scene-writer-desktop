
import {
  useEffect,
  useState,
} from "react";

import {
  episodeService,
  projectService,
} from "../../application";

import type {
  Project,
  ProjectStatus,
  ProjectType,
} from "../../types";

import {
  CharactersWorkspace,
} from "../characters/CharactersWorkspace";

import {
  LocationsWorkspace,
} from "../locations/LocationsWorkspace";

import {
  ScenesWorkspace,
} from "../scenes/ScenesWorkspace";

import {
  ProjectStoryEditor,
} from "../stories/ProjectStoryEditor";

import {
  ProjectStructureWorkspace,
} from "../structure/ProjectStructureWorkspace";

import {
  ExportWorkspace,
} from "../export/ExportWorkspace";

export type ProjectWorkspaceSection =
  | "dashboard"
  | "story"
  | "characters"
  | "locations"
  | "structure"
  | "scenes"
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

  onSelectProjectSection: (
    section: ProjectWorkspaceSection,
  ) => void;
}

export function ProjectWorkspace({
  projectId,
  activeSection,
  onProjectLoaded,
  onBackToLibrary,
  onSelectProjectSection,
}: ProjectWorkspaceProps) {
  const [project, setProject] =
    useState<Project | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [hasRequiredEpisode, setHasRequiredEpisode] =
    useState<boolean | null>(null);

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

  useEffect(() => {
    let isCancelled = false;

    async function checkRequiredEpisode(): Promise<void> {
      if (project === null) {
        setHasRequiredEpisode(null);
        return;
      }

      const usesEpisodes =
        project.projectType === "series" ||
        project.projectType === "single_episode";

      if (!usesEpisodes) {
        setHasRequiredEpisode(true);
        return;
      }

      setHasRequiredEpisode(null);

      try {
        const episodes =
          await episodeService.listEpisodes(project.id);

        if (!isCancelled) {
          setHasRequiredEpisode(episodes.length > 0);
        }
      } catch (caughtError) {
        if (!isCancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : String(caughtError),
          );
        }
      }
    }

    void checkRequiredEpisode();

    return () => {
      isCancelled = true;
    };
  }, [project]);

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

  if (
    activeSection === "locations"
  ) {
    return (
      <LocationsWorkspace
        project={project}
      />
    );
  }

  if (
    activeSection === "structure"
  ) {
    return (
      <ProjectStructureWorkspace
        project={project}
        onFirstEpisodeCreated={() => {
          setHasRequiredEpisode(true);
          onSelectProjectSection("scenes");
        }}
      />
    );
  }

  if (
    activeSection === "scenes"
  ) {
    const usesEpisodes =
      project.projectType === "series" ||
      project.projectType === "single_episode";

    if (usesEpisodes && hasRequiredEpisode === null) {
      return (
        <WorkspaceState>
          جارٍ التحقق من حلقات المشروع...
        </WorkspaceState>
      );
    }

    if (usesEpisodes && hasRequiredEpisode === false) {
      return (
        <ProjectStructureWorkspace
          project={project}
          onFirstEpisodeCreated={() => {
            setHasRequiredEpisode(true);
            onSelectProjectSection("scenes");
          }}
        />
      );
    }

    return (
      <ScenesWorkspace
        project={project}
      />
    );
  }

  if (
    activeSection === "export"
  ) {
    return (
      <ExportWorkspace
        project={project}
      />
    );
  }

  if (
    activeSection === "project-settings"
  ) {
    return (
      <ProjectSettingsWorkspace
        project={project}
        onProjectUpdated={(updatedProject) => {
          setProject(updatedProject);
          onProjectLoaded(updatedProject);
        }}
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

interface ProjectSettingsWorkspaceProps {
  project: Project;
  onProjectUpdated: (project: Project) => void;
}

interface ProjectSettingsForm {
  title: string;
  subtitle: string;
  authorName: string;
  description: string;
  status: ProjectStatus;
  plannedSeasonCount: string;
  plannedEpisodeCount: string;
  defaultEpisodeDurationMinutes: string;
  defaultMinimumScenesPerEpisode: string;
  defaultMaximumScenesPerEpisode: string;
}

function ProjectSettingsWorkspace({
  project,
  onProjectUpdated,
}: ProjectSettingsWorkspaceProps) {
  const [form, setForm] =
    useState<ProjectSettingsForm>(() =>
      projectToSettingsForm(project),
    );
  const [savedForm, setSavedForm] =
    useState<ProjectSettingsForm>(() =>
      projectToSettingsForm(project),
    );
  const [isSaving, setIsSaving] =
    useState(false);
  const [saveError, setSaveError] =
    useState<string | null>(null);
  const [saveMessage, setSaveMessage] =
    useState<string | null>(null);

  useEffect(() => {
    const nextForm =
      projectToSettingsForm(project);

    setForm(nextForm);
    setSavedForm(nextForm);
  }, [project.id, project.updatedAt]);

  const isDirty =
    JSON.stringify(form) !==
    JSON.stringify(savedForm);

  async function saveProjectSettings():
    Promise<void> {
    if (isSaving) {
      return;
    }

    if (!form.title.trim()) {
      setSaveError(
        "عنوان المشروع إلزامي.",
      );
      return;
    }

    const minimumScenes =
      parseOptionalPositiveInteger(
        form.defaultMinimumScenesPerEpisode,
      );
    const maximumScenes =
      parseOptionalPositiveInteger(
        form.defaultMaximumScenesPerEpisode,
      );

    if (
      minimumScenes !== null &&
      maximumScenes !== null &&
      minimumScenes > maximumScenes
    ) {
      setSaveError(
        "الحد الأدنى للمشاهد لا يمكن أن يتجاوز الحد الأقصى.",
      );
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const updatedProject =
        await projectService.updateProject(
          project.id,
          {
            title: form.title,
            subtitle: form.subtitle,
            authorName: form.authorName,
            description: form.description,
            status: form.status,
            plannedSeasonCount:
              parseOptionalPositiveInteger(
                form.plannedSeasonCount,
              ),
            plannedEpisodeCount:
              parseOptionalPositiveInteger(
                form.plannedEpisodeCount,
              ),
            defaultEpisodeDurationMinutes:
              parseOptionalPositiveInteger(
                form.defaultEpisodeDurationMinutes,
              ),
            defaultMinimumScenesPerEpisode:
              minimumScenes,
            defaultMaximumScenesPerEpisode:
              maximumScenes,
          },
        );

      const nextForm =
        projectToSettingsForm(updatedProject);

      setForm(nextForm);
      setSavedForm(nextForm);
      setSaveMessage(
        "تم حفظ إعدادات المشروع.",
      );
      onProjectUpdated(updatedProject);
    } catch (caughtError) {
      setSaveError(
        caughtError instanceof Error
          ? caughtError.message
          : String(caughtError),
      );
    } finally {
      setIsSaving(false);
    }
  }

  const isSeries =
    project.projectType === "series";
  const usesEpisodeDuration =
    isSeries ||
    project.projectType ===
      "single_episode";

  return (
    <main
      className="project-settings-workspace"
      dir="rtl"
    >
      <header className="project-settings-header">
        <div>
          <span>إعدادات المشروع</span>
          <h1>{project.title}</h1>
          <p>
            عدّل بيانات المشروع الأساسية
            وخططه العددية دون تغيير نوع
            العمل أو بنيته الحالية.
          </p>
        </div>

        <div className="project-settings-type">
          <small>نوع المشروع</small>
          <strong>
            {getProjectTypeLabel(
              project.projectType,
            )}
          </strong>
        </div>
      </header>

      {(saveError || saveMessage) && (
        <div
          className={
            saveError
              ? "project-settings-feedback is-error"
              : "project-settings-feedback is-success"
          }
          role={saveError ? "alert" : "status"}
        >
          {saveError ?? saveMessage}
        </div>
      )}

      <section className="project-settings-card">
        <div className="project-settings-section-heading">
          <span>البيانات الأساسية</span>
          <p>
            تظهر هذه البيانات في المكتبة
            والشريط الجانبي وصفحة الغلاف.
          </p>
        </div>

        <div className="project-settings-grid">
          <label className="project-settings-field is-wide">
            <span>عنوان المشروع</span>
            <input
              value={form.title}
              disabled={isSaving}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </label>

          <label className="project-settings-field is-wide">
            <span>العنوان الفرعي</span>
            <input
              value={form.subtitle}
              disabled={isSaving}
              placeholder="اختياري"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  subtitle: event.target.value,
                }))
              }
            />
          </label>

          <label className="project-settings-field">
            <span>اسم الكاتب</span>
            <input
              value={form.authorName}
              disabled={isSaving}
              placeholder="اختياري"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  authorName: event.target.value,
                }))
              }
            />
          </label>

          <label className="project-settings-field">
            <span>حالة المشروع</span>
            <select
              value={form.status}
              disabled={isSaving}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status:
                    event.target.value as
                      ProjectStatus,
                }))
              }
            >
              <option value="draft">مسودة</option>
              <option value="in_progress">قيد الإنجاز</option>
              <option value="review">قيد المراجعة</option>
              <option value="completed">مكتمل</option>
              <option value="archived">مؤرشف</option>
            </select>
          </label>

          <label className="project-settings-field is-wide">
            <span>وصف المشروع</span>
            <textarea
              value={form.description}
              disabled={isSaving}
              rows={5}
              placeholder="وصف مختصر للعمل..."
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>
        </div>
      </section>

      <section className="project-settings-card">
        <div className="project-settings-section-heading">
          <span>التخطيط العددي</span>
          <p>
            قيم استرشادية تساعد في عرض
            إحصاءات المشروع وتنظيمه.
          </p>
        </div>

        <div className="project-settings-grid">
          {isSeries && (
            <>
              <label className="project-settings-field">
                <span>عدد المواسم المخطط</span>
                <input
                  type="number"
                  min="1"
                  value={form.plannedSeasonCount}
                  disabled={
                    isSaving ||
                    project.seriesStructure ===
                      "single_season"
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      plannedSeasonCount:
                        event.target.value,
                    }))
                  }
                />
              </label>

              <label className="project-settings-field">
                <span>عدد الحلقات المخطط</span>
                <input
                  type="number"
                  min="1"
                  value={form.plannedEpisodeCount}
                  disabled={isSaving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      plannedEpisodeCount:
                        event.target.value,
                    }))
                  }
                />
              </label>
            </>
          )}

          {usesEpisodeDuration && (
            <label className="project-settings-field">
              <span>المدة المستهدفة بالدقائق</span>
              <input
                type="number"
                min="1"
                value={
                  form.defaultEpisodeDurationMinutes
                }
                disabled={isSaving}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultEpisodeDurationMinutes:
                      event.target.value,
                  }))
                }
              />
            </label>
          )}

          <label className="project-settings-field">
            <span>الحد الأدنى للمشاهد</span>
            <input
              type="number"
              min="1"
              value={
                form.defaultMinimumScenesPerEpisode
              }
              disabled={isSaving}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  defaultMinimumScenesPerEpisode:
                    event.target.value,
                }))
              }
            />
          </label>

          <label className="project-settings-field">
            <span>الحد الأقصى للمشاهد</span>
            <input
              type="number"
              min="1"
              value={
                form.defaultMaximumScenesPerEpisode
              }
              disabled={isSaving}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  defaultMaximumScenesPerEpisode:
                    event.target.value,
                }))
              }
            />
          </label>
        </div>
      </section>

      <footer className="project-settings-actions">
        <button
          type="button"
          className="project-settings-reset"
          disabled={isSaving || !isDirty}
          onClick={() => {
            setForm(savedForm);
            setSaveError(null);
            setSaveMessage(null);
          }}
        >
          إلغاء التعديلات
        </button>

        <button
          type="button"
          className="project-settings-save"
          disabled={isSaving || !isDirty}
          onClick={() => {
            void saveProjectSettings();
          }}
        >
          {isSaving
            ? "جارٍ الحفظ..."
            : "حفظ الإعدادات"}
        </button>
      </footer>
    </main>
  );
}

function projectToSettingsForm(
  project: Project,
): ProjectSettingsForm {
  return {
    title: project.title,
    subtitle: project.subtitle ?? "",
    authorName: project.authorName ?? "",
    description: project.description ?? "",
    status: project.status,
    plannedSeasonCount:
      formatOptionalNumber(
        project.plannedSeasonCount,
      ),
    plannedEpisodeCount:
      formatOptionalNumber(
        project.plannedEpisodeCount,
      ),
    defaultEpisodeDurationMinutes:
      formatOptionalNumber(
        project.defaultEpisodeDurationMinutes,
      ),
    defaultMinimumScenesPerEpisode:
      formatOptionalNumber(
        project.defaultMinimumScenesPerEpisode,
      ),
    defaultMaximumScenesPerEpisode:
      formatOptionalNumber(
        project.defaultMaximumScenesPerEpisode,
      ),
  };
}

function formatOptionalNumber(
  value: number | null,
): string {
  return value === null ? "" : String(value);
}

function parseOptionalPositiveInteger(
  value: string,
): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) &&
    parsed > 0
    ? parsed
    : null;
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
                "single_episode"
              ? "بنية الحلقة"
              : projectType ===
                  "stage_play"
                ? "بنية المسرحية"
                : "بنية العمل",

        description:
          projectType === "series"
            ? "تنظيم المواسم والحلقات وترتيبها."
            : projectType ===
                "single_episode"
              ? "إدارة بيانات الحلقة وملخصها وحالتها."
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
