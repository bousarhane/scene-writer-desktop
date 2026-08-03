import type {
  ProjectType,
} from "../../types";

interface ProjectTypeSelectorProps {
  selectedType:
    ProjectType | null;

  onSelect: (
    projectType: ProjectType,
  ) => void;
}

interface ProjectTypeOption {
  type: ProjectType;
  title: string;
  description: string;
  symbol: string;
}

const projectTypeOptions:
  ProjectTypeOption[] = [
    {
      type: "series",

      title:
        "مسلسل تلفزيوني",

      description:
        "عمل درامي يُبنى عبر حلقات، ويمكن أن يتكون من موسم واحد أو من مواسم متعددة.",

      symbol: "م",
    },
    {
      type: "film",

      title:
        "فيلم سينمائي",

      description:
        "عمل سينمائي طويل يُكتب في وثيقة سيناريو متصلة.",

      symbol: "ف",
    },
    {
      type: "short_film",

      title:
        "فيلم قصير",

      description:
        "عمل سينمائي مكثف بمدة محدودة وبنية درامية مركزة.",

      symbol: "ق",
    },
    {
      type: "single_episode",

      title:
        "حلقة منفردة",

      description:
        "حلقة درامية واحدة مستقلة، تلفزيونية أو موجهة إلى منصة رقمية.",

      symbol: "ح",
    },
    {
      type: "stage_play",

      title:
        "مسرحية",

      description:
        "نص درامي مخصص للعرض المسرحي الحي، ببنيته وإرشاداته الخاصة.",

      symbol: "س",
    },
  ];

export function ProjectTypeSelector({
  selectedType,
  onSelect,
}: ProjectTypeSelectorProps) {
  return (
    <div className="project-type-selector">
      <div className="project-type-selector-heading">
        <h3>
          ما نوع العمل الذي تريد
          إنشاءه؟
        </h3>

        <p>
          يحدد نوع المشروع بنية
          المحرر وطريقة تنظيم النص،
          وليس مجرد تسمية للمشروع.
        </p>
      </div>

      <div className="project-type-options">
        {projectTypeOptions.map(
          (option) => {
            const isSelected =
              selectedType ===
              option.type;

            return (
              <button
                key={option.type}
                type="button"
                className={
                  isSelected
                    ? "project-type-option is-selected"
                    : "project-type-option"
                }
                aria-pressed={
                  isSelected
                }
                onClick={() => {
                  onSelect(
                    option.type,
                  );
                }}
              >
                <span className="project-type-option-symbol">
                  {option.symbol}
                </span>

                <span className="project-type-option-copy">
                  <strong>
                    {option.title}
                  </strong>

                  <small>
                    {
                      option.description
                    }
                  </small>
                </span>

                <span
                  className="project-type-option-check"
                  aria-hidden="true"
                >
                  {isSelected
                    ? "✓"
                    : ""}
                </span>
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}