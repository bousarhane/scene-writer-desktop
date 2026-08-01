import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type { Project } from "../../types";
import { useProjects } from "./useProjects";

interface SeriesFormState {
  title: string;
  plannedSeasonCount: string;
  plannedEpisodeCount: string;
  episodeDurationMinutes: string;
  minimumScenesPerEpisode: string;
  maximumScenesPerEpisode: string;
}

const initialFormState: SeriesFormState = {
  title: "",
  plannedSeasonCount: "1",
  plannedEpisodeCount: "30",
  episodeDurationMinutes: "52",
  minimumScenesPerEpisode: "24",
  maximumScenesPerEpisode: "26",
};

export function ProjectsPage() {
  const {
    projects,
    isLoading,
    error,
    createSeries,
    deleteProject,
  } = useProjects();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [form, setForm] =
    useState<SeriesFormState>(initialFormState);

  const projectCountLabel = useMemo(() => {
    if (projects.length === 0) {
      return "لا توجد مشاريع";
    }

    if (projects.length === 1) {
      return "مشروع واحد";
    }

    return `${projects.length} مشاريع`;
  }, [projects.length]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);

    const createdProject = await createSeries({
      title: form.title,

      plannedSeasonCount:
        Number(form.plannedSeasonCount),

      plannedEpisodeCount:
        Number(form.plannedEpisodeCount),

      episodeDurationMinutes:
        Number(form.episodeDurationMinutes),

      minimumScenesPerEpisode:
        parseOptionalNumber(
          form.minimumScenesPerEpisode,
        ),

      maximumScenesPerEpisode:
        parseOptionalNumber(
          form.maximumScenesPerEpisode,
        ),
    });

    setIsSubmitting(false);

    if (createdProject !== null) {
      setForm(initialFormState);
      setIsFormOpen(false);
    }
  }

  async function handleDelete(
    project: Project,
  ): Promise<void> {
    const confirmed = window.confirm(
      `هل تريد حذف مشروع «${project.title}»؟\n\nلن يمكن التراجع عن هذا الإجراء.`,
    );

    if (!confirmed) {
      return;
    }

    await deleteProject(project.id);
  }

  return (
    <main className="projects-page" dir="rtl">
      <header className="projects-header">
        <div>
          <p className="app-kicker">Scene Writer</p>
          <h1>مكتبة المشاريع</h1>
          <p className="projects-count">
            {projectCountLabel}
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => setIsFormOpen(true)}
        >
          مشروع جديد
        </button>
      </header>

      {error !== null && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {isFormOpen && (
        <section className="project-form-panel">
          <div className="section-heading">
            <div>
              <h2>إنشاء مسلسل جديد</h2>
              <p>
                حدد البنية العامة للمسلسل قبل بدء
                الكتابة.
              </p>
            </div>

            <button
              type="button"
              className="text-button"
              onClick={() => setIsFormOpen(false)}
            >
              إغلاق
            </button>
          </div>

          <form
            className="project-form"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <label className="full-width-field">
              <span>عنوان المشروع</span>
              <input
                type="text"
                value={form.title}
                autoFocus
                required
                placeholder="مثال: حد الخاوة"
                onChange={(event) => {
                  setForm({
                    ...form,
                    title: event.target.value,
                  });
                }}
              />
            </label>

            <label>
              <span>عدد المواسم</span>
              <input
                type="number"
                min="1"
                required
                value={form.plannedSeasonCount}
                onChange={(event) => {
                  setForm({
                    ...form,
                    plannedSeasonCount:
                      event.target.value,
                  });
                }}
              />
            </label>

            <label>
              <span>عدد الحلقات</span>
              <input
                type="number"
                min="1"
                required
                value={form.plannedEpisodeCount}
                onChange={(event) => {
                  setForm({
                    ...form,
                    plannedEpisodeCount:
                      event.target.value,
                  });
                }}
              />
            </label>

            <label>
              <span>مدة الحلقة بالدقائق</span>
              <input
                type="number"
                min="1"
                required
                value={form.episodeDurationMinutes}
                onChange={(event) => {
                  setForm({
                    ...form,
                    episodeDurationMinutes:
                      event.target.value,
                  });
                }}
              />
            </label>

            <label>
              <span>الحد الأدنى للمشاهد</span>
              <input
                type="number"
                min="0"
                value={form.minimumScenesPerEpisode}
                onChange={(event) => {
                  setForm({
                    ...form,
                    minimumScenesPerEpisode:
                      event.target.value,
                  });
                }}
              />
            </label>

            <label>
              <span>الحد الأقصى للمشاهد</span>
              <input
                type="number"
                min="0"
                value={form.maximumScenesPerEpisode}
                onChange={(event) => {
                  setForm({
                    ...form,
                    maximumScenesPerEpisode:
                      event.target.value,
                  });
                }}
              />
            </label>

            <div className="form-actions full-width-field">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsFormOpen(false)}
              >
                إلغاء
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "جارٍ الحفظ..."
                  : "إنشاء المشروع"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="projects-content">
        {isLoading ? (
          <div className="empty-state">
            جارٍ تحميل المشاريع...
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <h2>لا توجد مشاريع بعد</h2>
            <p>
              أنشئ مشروعك الأول لبدء بناء المسلسل
              وكتابة حلقاته.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={() => setIsFormOpen(true)}
            >
              إنشاء أول مشروع
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <article
                className="project-card"
                key={project.id}
              >
                <div className="project-card-main">
                  <span className="project-type">
                    {getProjectTypeLabel(
                      project.projectType,
                    )}
                  </span>

                  <h2>{project.title}</h2>

                  <div className="project-metadata">
                    {project.projectType ===
                      "series" && (
                      <>
                        <span>
                          {project.plannedEpisodeCount ??
                            "—"}{" "}
                          حلقة
                        </span>

                        <span>
                          {project.defaultEpisodeDurationMinutes ??
                            "—"}{" "}
                          دقيقة
                        </span>

                        <span>
                          {project.plannedSeasonCount ??
                            "—"}{" "}
                          موسم
                        </span>
                      </>
                    )}
                  </div>

                  <p className="project-date">
                    آخر تعديل:{" "}
                    {formatDate(project.updatedAt)}
                  </p>
                </div>

                <div className="project-card-actions">
                  <button
                    type="button"
                    className="open-button"
                  >
                    فتح المشروع
                  </button>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => {
                      void handleDelete(project);
                    }}
                  >
                    حذف
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function parseOptionalNumber(
  value: string,
): number | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : null;
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ar-MA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}