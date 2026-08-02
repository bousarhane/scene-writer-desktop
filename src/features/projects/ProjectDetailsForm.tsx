import type { ProjectType } from "../../types";

export interface ProjectDetailsFormState {
  title: string;
  durationMinutes: string;
  plannedSeasonCount: string;
  plannedEpisodeCount: string;
  minimumScenes: string;
  maximumScenes: string;
}

interface ProjectDetailsFormProps {
  projectType: ProjectType;
  form: ProjectDetailsFormState;

  onChange: (
    form: ProjectDetailsFormState,
  ) => void;
}

export function ProjectDetailsForm({
  projectType,
  form,
  onChange,
}: ProjectDetailsFormProps) {
  const configuration =
    getProjectTypeConfiguration(projectType);

  return (
    <div className="project-details-step">
      <div className="project-details-heading">
        <span>{configuration.kicker}</span>

        <h3>{configuration.title}</h3>

        <p>{configuration.description}</p>
      </div>

      <div className="project-details-fields">
        <label className="project-dialog-field project-dialog-field--full">
          <span>{configuration.titleLabel}</span>

          <input
            type="text"
            autoFocus
            required
            maxLength={180}
            placeholder={
              configuration.titlePlaceholder
            }
            value={form.title}
            onChange={(event) => {
              onChange({
                ...form,
                title: event.target.value,
              });
            }}
          />
        </label>

        {projectType === "series" && (
          <>
            <label className="project-dialog-field">
              <span>عدد المواسم</span>

              <input
                type="number"
                min="1"
                required
                value={form.plannedSeasonCount}
                onChange={(event) => {
                  onChange({
                    ...form,
                    plannedSeasonCount:
                      event.target.value,
                  });
                }}
              />
            </label>

            <label className="project-dialog-field">
              <span>عدد الحلقات الإجمالي</span>

              <input
                type="number"
                min="1"
                required
                value={form.plannedEpisodeCount}
                onChange={(event) => {
                  onChange({
                    ...form,
                    plannedEpisodeCount:
                      event.target.value,
                  });
                }}
              />
            </label>
          </>
        )}

        {projectType === "single_episode" && (
          <div className="project-dialog-information">
            سيُنشأ هذا المشروع بوصفه حلقة واحدة
            مستقلة.
          </div>
        )}

        <label className="project-dialog-field">
          <span>{configuration.durationLabel}</span>

          <input
            type="number"
            min="1"
            required
            value={form.durationMinutes}
            onChange={(event) => {
              onChange({
                ...form,
                durationMinutes:
                  event.target.value,
              });
            }}
          />
        </label>

        <label className="project-dialog-field">
          <span>
            {configuration.minimumScenesLabel}
          </span>

          <input
            type="number"
            min="0"
            value={form.minimumScenes}
            onChange={(event) => {
              onChange({
                ...form,
                minimumScenes:
                  event.target.value,
              });
            }}
          />
        </label>

        <label className="project-dialog-field">
          <span>
            {configuration.maximumScenesLabel}
          </span>

          <input
            type="number"
            min="0"
            value={form.maximumScenes}
            onChange={(event) => {
              onChange({
                ...form,
                maximumScenes:
                  event.target.value,
              });
            }}
          />
        </label>
      </div>
    </div>
  );
}

interface ProjectTypeConfiguration {
  kicker: string;
  title: string;
  description: string;

  titleLabel: string;
  titlePlaceholder: string;

  durationLabel: string;
  minimumScenesLabel: string;
  maximumScenesLabel: string;
}

function getProjectTypeConfiguration(
  projectType: ProjectType,
): ProjectTypeConfiguration {
  switch (projectType) {
    case "series":
      return {
        kicker: "مسلسل تلفزيوني",
        title: "حدد البنية العامة للمسلسل",
        description:
          "يمكن تعديل عدد المواسم والحلقات ومدة الحلقة لاحقًا.",

        titleLabel: "عنوان المسلسل",
        titlePlaceholder: "مثال: حد الخاوة",

        durationLabel: "مدة الحلقة بالدقائق",
        minimumScenesLabel:
          "الحد الأدنى لمشاهد الحلقة",
        maximumScenesLabel:
          "الحد الأقصى لمشاهد الحلقة",
      };

    case "film":
      return {
        kicker: "فيلم سينمائي",
        title: "حدد البنية العامة للفيلم",
        description:
          "أدخل المدة المستهدفة وعدد المشاهد المتوقع للفيلم.",

        titleLabel: "عنوان الفيلم",
        titlePlaceholder: "عنوان الفيلم السينمائي",

        durationLabel:
          "المدة المستهدفة بالدقائق",
        minimumScenesLabel:
          "الحد الأدنى للمشاهد",
        maximumScenesLabel:
          "الحد الأقصى للمشاهد",
      };

    case "short_film":
      return {
        kicker: "فيلم قصير",
        title: "حدد البنية العامة للفيلم القصير",
        description:
          "يمكنك تحديد مدة تقريبية ونطاق متوقع لعدد المشاهد.",

        titleLabel: "عنوان الفيلم القصير",
        titlePlaceholder: "عنوان الفيلم القصير",

        durationLabel:
          "المدة المستهدفة بالدقائق",
        minimumScenesLabel:
          "الحد الأدنى للمشاهد",
        maximumScenesLabel:
          "الحد الأقصى للمشاهد",
      };

    case "single_episode":
      return {
        kicker: "حلقة منفردة",
        title: "حدد بنية الحلقة",
        description:
          "سيُنشأ المشروع بوصفه حلقة واحدة مكتملة ومستقلة.",

        titleLabel: "عنوان الحلقة",
        titlePlaceholder: "عنوان الحلقة المنفردة",

        durationLabel: "مدة الحلقة بالدقائق",
        minimumScenesLabel:
          "الحد الأدنى للمشاهد",
        maximumScenesLabel:
          "الحد الأقصى للمشاهد",
      };

    case "stage_play":
      return {
        kicker: "مسرحية",
        title: "حدد البنية الأولية للمسرحية",
        description:
          "أدخل مدة العرض والنطاق المتوقع لعدد المشاهد أو اللوحات.",

        titleLabel: "عنوان المسرحية",
        titlePlaceholder: "عنوان المسرحية",

        durationLabel:
          "مدة العرض المتوقعة بالدقائق",
        minimumScenesLabel:
          "الحد الأدنى للمشاهد أو اللوحات",
        maximumScenesLabel:
          "الحد الأقصى للمشاهد أو اللوحات",
      };
  }
}