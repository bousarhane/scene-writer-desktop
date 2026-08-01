import {
  useEffect,
  useState,
} from "react";

import { projectService } from "../../application";
import type { Project } from "../../types";

interface ProjectOverviewProps {
  projectId: string;
  onBackToLibrary: () => void;
}

export function ProjectOverview({
  projectId,
  onBackToLibrary,
}: ProjectOverviewProps) {
  const [project, setProject] =
    useState<Project | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadProject(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const selectedProject =
          await projectService.getProject(
            projectId,
          );

        setProject(selectedProject);

        if (selectedProject !== null) {
          await projectService
            .markProjectAsOpened(projectId);
        }
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : String(caughtError),
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadProject();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="project-overview-state">
        جارٍ فتح المشروع...
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="project-overview-state">
        <h2>تعذر فتح المشروع</h2>
        <p>{error}</p>

        <button
          type="button"
          className="primary-button"
          onClick={onBackToLibrary}
        >
          العودة إلى المكتبة
        </button>
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="project-overview-state">
        <h2>المشروع غير موجود</h2>

        <button
          type="button"
          className="primary-button"
          onClick={onBackToLibrary}
        >
          العودة إلى المكتبة
        </button>
      </div>
    );
  }

  return (
    <main
      className="project-overview"
      dir="rtl"
    >
      <div className="project-overview-heading">
        <div>
          <span className="project-type">
            {getProjectTypeLabel(
              project.projectType,
            )}
          </span>

          <h1>{project.title}</h1>

          <p>
            نظرة عامة على المشروع
            وبنيته الأساسية.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={onBackToLibrary}
        >
          العودة إلى المكتبة
        </button>
      </div>

      <section className="project-overview-grid">
        <article className="overview-stat-card">
          <span>عدد المواسم</span>

          <strong>
            {project.plannedSeasonCount ??
              "—"}
          </strong>
        </article>

        <article className="overview-stat-card">
          <span>عدد الحلقات</span>

          <strong>
            {project.plannedEpisodeCount ??
              "—"}
          </strong>
        </article>

        <article className="overview-stat-card">
          <span>مدة الحلقة</span>

          <strong>
            {project.defaultEpisodeDurationMinutes
              ? `${project.defaultEpisodeDurationMinutes} دقيقة`
              : "—"}
          </strong>
        </article>

        <article className="overview-stat-card">
          <span>
            عدد المشاهد المستهدف
          </span>

          <strong>
            {formatSceneRange(project)}
          </strong>
        </article>
      </section>

      <section className="project-start-panel">
        <h2>فضاء المشروع</h2>

        <p>
          بعد فتح فضاء المشروع، سيتحول
          الشريط الجانبي إلى أدوات مرتبطة
          بهذا المشروع: الحكاية والمواسم
          والحلقات والشخصيات والأماكن
          والمشاهد والتصدير.
        </p>

        <button
          type="button"
          className="primary-button"
        >
          فتح فضاء المشروع
        </button>
      </section>
    </main>
  );
}

function formatSceneRange(
  project: Project,
): string {
  const minimum =
    project.defaultMinimumScenesPerEpisode;

  const maximum =
    project.defaultMaximumScenesPerEpisode;

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

  return String(minimum ?? maximum);
}

function getProjectTypeLabel(
  projectType: Project["projectType"],
): string {
  switch (projectType) {
    case "series":
      return "مسلسل";

    case "film":
      return "فيلم";

    case "short_film":
      return "فيلم قصير";

    case "single_episode":
      return "حلقة منفردة";

    case "stage_play":
      return "مسرحية";
  }
}