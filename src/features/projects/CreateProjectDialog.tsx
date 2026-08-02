import {
  useState,
  type FormEvent,
} from "react";

import type {
  Project,
  ProjectType,
} from "../../types";

import {
  ProjectDetailsForm,
  type ProjectDetailsFormState,
} from "./ProjectDetailsForm";

import { ProjectTypeSelector } from "./ProjectTypeSelector";

export interface CreateProjectDialogInput {
  title: string;
  projectType: ProjectType;

  plannedSeasonCount: number | null;
  plannedEpisodeCount: number | null;

  durationMinutes: number;
  minimumScenes: number | null;
  maximumScenes: number | null;
}

interface CreateProjectDialogProps {
  isOpen: boolean;
  isSubmitting: boolean;
  error: string | null;

  onClose: () => void;

  onCreateProject: (
    input: CreateProjectDialogInput,
  ) => Promise<Project | null>;
}

type DialogStep =
  | "project-type"
  | "project-details";

const initialFormState: ProjectDetailsFormState = {
  title: "",
  durationMinutes: "52",
  plannedSeasonCount: "1",
  plannedEpisodeCount: "30",
  minimumScenes: "24",
  maximumScenes: "26",
};

export function CreateProjectDialog({
  isOpen,
  isSubmitting,
  error,
  onClose,
  onCreateProject,
}: CreateProjectDialogProps) {
  const [step, setStep] =
    useState<DialogStep>("project-type");

  const [selectedType, setSelectedType] =
    useState<ProjectType | null>(null);

  const [form, setForm] =
    useState<ProjectDetailsFormState>(
      initialFormState,
    );

  if (!isOpen) {
    return null;
  }

  function handleTypeSelection(
    projectType: ProjectType,
  ): void {
    setSelectedType(projectType);

    setForm(
      getInitialFormState(projectType),
    );
  }

  function goToDetails(): void {
    if (selectedType === null) {
      return;
    }

    setStep("project-details");
  }

  function goBackToTypeSelection(): void {
    if (isSubmitting) {
      return;
    }

    setStep("project-type");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (selectedType === null) {
      return;
    }

    const createdProject =
      await onCreateProject({
        title: form.title.trim(),
        projectType: selectedType,

        plannedSeasonCount:
          getSeasonCount(
            selectedType,
            form.plannedSeasonCount,
          ),

        plannedEpisodeCount:
          getEpisodeCount(
            selectedType,
            form.plannedEpisodeCount,
          ),

        durationMinutes:
          Number(form.durationMinutes),

        minimumScenes:
          parseOptionalNumber(
            form.minimumScenes,
          ),

        maximumScenes:
          parseOptionalNumber(
            form.maximumScenes,
          ),
      });

    if (createdProject !== null) {
      resetDialog();
      onClose();
    }
  }

  function handleClose(): void {
    if (isSubmitting) {
      return;
    }

    resetDialog();
    onClose();
  }

  function resetDialog(): void {
    setStep("project-type");
    setSelectedType(null);
    setForm(initialFormState);
  }

  return (
    <div
      className="project-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
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
              عمل درامي جديد
            </span>

            <h2 id="create-project-title">
              إنشاء مشروع
            </h2>

            <p>
              {step === "project-type"
                ? "ابدأ باختيار نوع العمل الذي تريد بناءه."
                : "أدخل المعلومات الأساسية للعمل المختار."}
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

        <div className="project-dialog-progress">
          <span
            className={
              step === "project-type"
                ? "is-active"
                : "is-completed"
            }
          >
            1
          </span>

          <i />

          <span
            className={
              step === "project-details"
                ? "is-active"
                : ""
            }
          >
            2
          </span>
        </div>

        {error !== null && (
          <div
            className="project-dialog-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {step === "project-type" ? (
          <div className="project-dialog-step">
            <ProjectTypeSelector
              selectedType={selectedType}
              onSelect={handleTypeSelection}
            />

            <footer className="project-dialog-actions">
              <button
                type="button"
                className="project-dialog-secondary-button"
                onClick={handleClose}
              >
                إلغاء
              </button>

              <button
                type="button"
                className="project-dialog-primary-button"
                disabled={
                  selectedType === null
                }
                onClick={goToDetails}
              >
                التالي
              </button>
            </footer>
          </div>
        ) : (
          <form
            className="project-dialog-form"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            {selectedType !== null && (
              <ProjectDetailsForm
                projectType={selectedType}
                form={form}
                onChange={setForm}
              />
            )}

            <footer className="project-dialog-actions">
              <button
                type="button"
                className="project-dialog-secondary-button"
                disabled={isSubmitting}
                onClick={
                  goBackToTypeSelection
                }
              >
                السابق
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
        )}
      </section>
    </div>
  );
}

function getInitialFormState(
  projectType: ProjectType,
): ProjectDetailsFormState {
  switch (projectType) {
    case "series":
      return {
        title: "",
        durationMinutes: "52",
        plannedSeasonCount: "1",
        plannedEpisodeCount: "30",
        minimumScenes: "24",
        maximumScenes: "26",
      };

    case "film":
      return {
        title: "",
        durationMinutes: "100",
        plannedSeasonCount: "",
        plannedEpisodeCount: "",
        minimumScenes: "40",
        maximumScenes: "60",
      };

    case "short_film":
      return {
        title: "",
        durationMinutes: "20",
        plannedSeasonCount: "",
        plannedEpisodeCount: "",
        minimumScenes: "8",
        maximumScenes: "18",
      };

    case "single_episode":
      return {
        title: "",
        durationMinutes: "52",
        plannedSeasonCount: "",
        plannedEpisodeCount: "1",
        minimumScenes: "24",
        maximumScenes: "26",
      };

    case "stage_play":
      return {
        title: "",
        durationMinutes: "90",
        plannedSeasonCount: "",
        plannedEpisodeCount: "",
        minimumScenes: "",
        maximumScenes: "",
      };
  }
}

function getSeasonCount(
  projectType: ProjectType,
  value: string,
): number | null {
  if (projectType !== "series") {
    return null;
  }

  return Number(value);
}

function getEpisodeCount(
  projectType: ProjectType,
  value: string,
): number | null {
  if (projectType === "series") {
    return Number(value);
  }

  if (projectType === "single_episode") {
    return 1;
  }

  return null;
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