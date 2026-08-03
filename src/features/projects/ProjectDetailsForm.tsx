import type {
  ProjectType,
  SeriesStructure,
} from "../../types";

export interface ProjectDetailsFormState {
  title: string;
  authorName: string;

  seriesStructure:
    SeriesStructure;

  durationMinutes: string;

  plannedSeasonCount: string;
  plannedEpisodeCount: string;

  minimumScenes: string;
  maximumScenes: string;
}

interface ProjectDetailsFormProps {
  projectType: ProjectType;

  form:
    ProjectDetailsFormState;

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
    getProjectTypeConfiguration(
      projectType,
    );

  const isSeries =
    projectType === "series";

  const isMultiSeasonSeries =
    isSeries &&
    form.seriesStructure ===
      "multi_season";

  return (
    <div className="project-details-step">
      <div className="project-details-heading">
        <span>
          {configuration.kicker}
        </span>

        <h3>
          {configuration.title}
        </h3>

        <p>
          {
            configuration.description
          }
        </p>
      </div>

      <div className="project-details-fields">
        <label className="project-dialog-field project-dialog-field--full">
          <span>
            {
              configuration.titleLabel
            }
          </span>

          <input
            type="text"
            autoFocus
            required
            maxLength={180}
            placeholder={
              configuration
                .titlePlaceholder
            }
            value={form.title}
            onChange={(event) => {
              onChange({
                ...form,

                title:
                  event.target.value,
              });
            }}
          />
        </label>

        <label className="project-dialog-field project-dialog-field--full">
          <span>
            اسم الكاتب
          </span>

          <input
            type="text"
            maxLength={180}
            placeholder="اسم الكاتب أو الكاتبة"
            value={form.authorName}
            onChange={(event) => {
              onChange({
                ...form,

                authorName:
                  event.target.value,
              });
            }}
          />
        </label>

        {isSeries && (
          <fieldset className="project-dialog-field project-dialog-field--full">
            <legend>
              بنية المسلسل
            </legend>

            <div className="project-series-structure-options">
              <label className="project-series-structure-option">
                <input
                  type="radio"
                  name="series-structure"
                  value="single_season"
                  checked={
                    form.seriesStructure ===
                    "single_season"
                  }
                  onChange={() => {
                    onChange({
                      ...form,

                      seriesStructure:
                        "single_season",

                      plannedSeasonCount:
                        "1",
                    });
                  }}
                />

                <span>
                  <strong>
                    مسلسل من موسم واحد
                  </strong>

                  <small>
                    حلقات تنتمي إلى حكاية
                    مكتملة من غير طبقة
                    مواسم إضافية في
                    الواجهة.
                  </small>
                </span>
              </label>

              <label className="project-series-structure-option">
                <input
                  type="radio"
                  name="series-structure"
                  value="multi_season"
                  checked={
                    form.seriesStructure ===
                    "multi_season"
                  }
                  onChange={() => {
                    onChange({
                      ...form,

                      seriesStructure:
                        "multi_season",

                      plannedSeasonCount:
                        form
                          .plannedSeasonCount ===
                        "1"
                          ? "2"
                          : form
                              .plannedSeasonCount,
                    });
                  }}
                />

                <span>
                  <strong>
                    مسلسل متعدد المواسم
                  </strong>

                  <small>
                    يُنظم المشروع إلى
                    مواسم، ويضم كل موسم
                    حلقاته وقوسه الدرامي.
                  </small>
                </span>
              </label>
            </div>
          </fieldset>
        )}

        {isMultiSeasonSeries && (
          <label className="project-dialog-field">
            <span>
              عدد المواسم المتوقع
            </span>

            <input
              type="number"
              min="2"
              required
              value={
                form.plannedSeasonCount
              }
              onChange={(event) => {
                onChange({
                  ...form,

                  plannedSeasonCount:
                    event.target.value,
                });
              }}
            />
          </label>
        )}

        {isSeries && (
          <label className="project-dialog-field">
            <span>
              عدد الحلقات المتوقع
            </span>

            <input
              type="number"
              min="1"
              required
              value={
                form.plannedEpisodeCount
              }
              onChange={(event) => {
                onChange({
                  ...form,

                  plannedEpisodeCount:
                    event.target.value,
                });
              }}
            />
          </label>
        )}

        {projectType ===
          "single_episode" && (
          <div className="project-dialog-information">
            سيُنشأ المشروع بوصفه
            حلقة واحدة مستقلة.
          </div>
        )}

        <label className="project-dialog-field">
          <span>
            {
              configuration.durationLabel
            }
          </span>

          <input
            type="number"
            min="1"
            value={
              form.durationMinutes
            }
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
            {
              configuration
                .minimumScenesLabel
            }
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
            {
              configuration
                .maximumScenesLabel
            }
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

        <div className="project-dialog-information project-dialog-field--full">
          هذه التقديرات ليست إلزامية
          أثناء الكتابة، ويمكن تعديلها
          لاحقًا. لن يطلب منك التطبيق
          إنشاء المشاهد واحدًا واحدًا
          قبل التحرير.
        </div>
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
        kicker:
          "مسلسل تلفزيوني",

        title:
          "حدد البنية العامة للمسلسل",

        description:
          "اختر أولًا ما إذا كان المسلسل من موسم واحد أو متعدد المواسم، ثم حدد تقديراته العامة.",

        titleLabel:
          "عنوان المسلسل",

        titlePlaceholder:
          "مثال: حد الخاوة",

        durationLabel:
          "مدة الحلقة بالدقائق",

        minimumScenesLabel:
          "الحد التقريبي الأدنى لمشاهد الحلقة",

        maximumScenesLabel:
          "الحد التقريبي الأقصى لمشاهد الحلقة",
      };

    case "film":
      return {
        kicker:
          "فيلم سينمائي",

        title:
          "حدد الهوية العامة للفيلم",

        description:
          "أدخل عنوان الفيلم وتقديراته الأولية. يمكن تعديل هذه البيانات في أي وقت.",

        titleLabel:
          "عنوان الفيلم",

        titlePlaceholder:
          "عنوان الفيلم السينمائي",

        durationLabel:
          "المدة المستهدفة بالدقائق",

        minimumScenesLabel:
          "الحد التقريبي الأدنى للمشاهد",

        maximumScenesLabel:
          "الحد التقريبي الأقصى للمشاهد",
      };

    case "short_film":
      return {
        kicker:
          "فيلم قصير",

        title:
          "حدد الهوية العامة للفيلم القصير",

        description:
          "حدد مدة تقريبية ونطاقًا متوقعًا للمشاهد، من غير أن تصبح هذه التقديرات قيودًا على التحرير.",

        titleLabel:
          "عنوان الفيلم القصير",

        titlePlaceholder:
          "عنوان الفيلم القصير",

        durationLabel:
          "المدة المستهدفة بالدقائق",

        minimumScenesLabel:
          "الحد التقريبي الأدنى للمشاهد",

        maximumScenesLabel:
          "الحد التقريبي الأقصى للمشاهد",
      };

    case "single_episode":
      return {
        kicker:
          "حلقة منفردة",

        title:
          "حدد الهوية العامة للحلقة",

        description:
          "سيُنشأ المشروع بوصفه حلقة واحدة مكتملة ومستقلة.",

        titleLabel:
          "عنوان الحلقة",

        titlePlaceholder:
          "عنوان الحلقة المنفردة",

        durationLabel:
          "مدة الحلقة بالدقائق",

        minimumScenesLabel:
          "الحد التقريبي الأدنى للمشاهد",

        maximumScenesLabel:
          "الحد التقريبي الأقصى للمشاهد",
      };

    case "stage_play":
      return {
        kicker:
          "مسرحية",

        title:
          "حدد الهوية العامة للمسرحية",

        description:
          "ستُبنى المسرحية لاحقًا داخل محرر خاص بالفصول واللوحات والحوار والإرشادات المسرحية.",

        titleLabel:
          "عنوان المسرحية",

        titlePlaceholder:
          "عنوان المسرحية",

        durationLabel:
          "مدة العرض المتوقعة بالدقائق",

        minimumScenesLabel:
          "الحد التقريبي الأدنى للمشاهد أو اللوحات",

        maximumScenesLabel:
          "الحد التقريبي الأقصى للمشاهد أو اللوحات",
      };
  }
}