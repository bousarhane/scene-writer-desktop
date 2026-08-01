import {
  useState,
  type FormEvent,
} from "react";

import type { Project } from "../../types";

export interface CreateSeriesDialogInput {
  title: string;
  plannedSeasonCount: number;
  plannedEpisodeCount: number;
  episodeDurationMinutes: number;
  minimumScenesPerEpisode: number | null;
  maximumScenesPerEpisode: number | null;
}

interface CreateProjectDialogProps {
  isOpen: boolean;
  isSubmitting: boolean;
  error: string | null;

  onClose: () => void;

  onCreateSeries: (
    input: CreateSeriesDialogInput,
  ) => Promise<Project | null>;
}

interface FormState {
  title: string;
  plannedSeasonCount: string;
  plannedEpisodeCount: string;
  episodeDurationMinutes: string;
  minimumScenesPerEpisode: string;
  maximumScenesPerEpisode: string;
}

const initialFormState: FormState = {
  title: "",
  plannedSeasonCount: "1",
  plannedEpisodeCount: "30",
  episodeDurationMinutes: "52",
  minimumScenesPerEpisode: "24",
  maximumScenesPerEpisode: "26",
};

export function CreateProjectDialog({
  isOpen,
  isSubmitting,
  error,
  onClose,
  onCreateSeries,
}: CreateProjectDialogProps) {
  const [form, setForm] =
    useState<FormState>(initialFormState);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const createdProject =
      await onCreateSeries({
        title: form.title.trim(),

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

    if (createdProject !== null) {
      setForm(initialFormState);
      onClose();
    }
  }

  function handleClose(): void {
    if (isSubmitting) {
      return;
    }

    setForm(initialFormState);
    onClose();
  }

  return (
    <div
      className="project-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <section
        className="project-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        dir="rtl"
      >
        <header className="project-dialog-header">
          <div>
            <span className="project-dialog-kicker">
              مشروع درامي جديد
            </span>

            <h2 id="create-project-title">
              إنشاء مسلسل
            </h2>

            <p>
              حدد البنية العامة للمسلسل. يمكن تعديل
              تفاصيل المشروع لاحقًا.
            </p>
          </div>

          <button
            type="button"
            className="project-dialog-close"
            aria-label="إغلاق النافذة"
            disabled={isSubmitting}
            onClick={handleClose}
          >
            ×
          </button>
        </header>

        {error !== null && (
          <div
            className="project-dialog-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <form
          className="project-dialog-form"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <label className="project-dialog-field project-dialog-field--full">
            <span>عنوان المشروع</span>

            <input
              type="text"
              autoFocus
              required
              maxLength={180}
              placeholder="مثال: حد الخاوة"
              value={form.title}
              onChange={(event) => {
                setForm({
                  ...form,
                  title: event.target.value,
                });
              }}
            />
          </label>

          <label className="project-dialog-field">
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

          <label className="project-dialog-field">
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

          <label className="project-dialog-field">
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

          <label className="project-dialog-field">
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

          <label className="project-dialog-field">
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

          <footer className="project-dialog-actions">
            <button
              type="button"
              className="project-dialog-secondary-button"
              disabled={isSubmitting}
              onClick={handleClose}
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="project-dialog-primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "جارٍ إنشاء المشروع..."
                : "إنشاء المشروع"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function parseOptionalNumber(
  value: string,
): number | null {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : null;
}