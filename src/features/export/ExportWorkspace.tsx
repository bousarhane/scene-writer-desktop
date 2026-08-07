import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  characterService,
  episodeService,
  locationService,
  projectStoryService,
  sceneElementService,
  sceneService,
  seasonService,
} from "../../application";

import type {
  Character,
  Episode,
  Location,
  Project,
  ProjectStory,
  Scene,
  SceneElement,
  Season,
} from "../../types";

import {
  exportProjectDossierToPdf,
  type ProjectDossierSectionId,
} from "./projectDossierPdfExporter";

import "./export-workspace.css";

interface ExportWorkspaceProps {
  project: Project;
}

interface ExportData {
  story: ProjectStory;
  characters: Character[];
  locations: Location[];
  seasons: Season[];
  episodes: Episode[];
  scenes: Scene[];
  elementsByScene: Record<string, SceneElement[]>;
}

interface ExportSectionOption {
  id: ProjectDossierSectionId;
  label: string;
  description: string;
}

const sectionOptions: ExportSectionOption[] = [
  {
    id: "project-info",
    label: "بيانات المشروع",
    description: "العنوان والنوع والكاتب والحالة والبيانات الأساسية.",
  },
  {
    id: "story",
    label: "الحكاية",
    description: "الفكرة والجملة التعريفية والملخص والصراع والموضوعات.",
  },
  {
    id: "characters",
    label: "الشخصيات",
    description: "بطاقات الشخصيات وملامحها وأهدافها وخلفياتها.",
  },
  {
    id: "locations",
    label: "الأماكن",
    description: "الأماكن ووصفها وتصنيفها وعلاقاتها المكانية.",
  },
  {
    id: "structure",
    label: "المواسم والحلقات",
    description: "بنية المواسم والحلقات وملخصاتها وحالاتها.",
  },
  {
    id: "screenplay",
    label: "السيناريو",
    description: "جميع المشاهد ونصوصها مرتبة داخل المشروع.",
  },
];

const defaultSections: ProjectDossierSectionId[] =
  sectionOptions.map((option) => option.id);

export function ExportWorkspace({ project }: ExportWorkspaceProps) {
  const [data, setData] = useState<ExportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCover, setShowCover] = useState(true);
  const [selectedSections, setSelectedSections] =
    useState<ProjectDossierSectionId[]>(defaultSections);

  useEffect(() => {
    let cancelled = false;

    async function loadExportData(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const [
          story,
          characters,
          locations,
          seasons,
          episodes,
          scenes,
        ] = await Promise.all([
          projectStoryService.getStory(project.id),
          characterService.listCharacters(project.id),
          locationService.listLocations(project.id),
          seasonService.listSeasons(project.id),
          episodeService.listEpisodes(project.id),
          sceneService.listScenes(project.id),
        ]);

        const elementEntries = await Promise.all(
          scenes.map(async (scene) => {
            const elements = await sceneElementService.listElements(scene.id);
            return [
              scene.id,
              [...elements].sort(
                (first, second) => first.orderIndex - second.orderIndex,
              ),
            ] as const;
          }),
        );

        if (cancelled) {
          return;
        }

        setData({
          story,
          characters,
          locations,
          seasons,
          episodes,
          scenes,
          elementsByScene: Object.fromEntries(elementEntries),
        });
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : String(caughtError),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadExportData();

    return () => {
      cancelled = true;
    };
  }, [project.id]);

  const sectionCounts = useMemo(() => {
    if (data === null) {
      return new Map<ProjectDossierSectionId, string>();
    }

    return new Map<ProjectDossierSectionId, string>([
      ["project-info", "1"],
      ["story", countStoryFields(data.story)],
      ["characters", String(data.characters.length)],
      ["locations", String(data.locations.length)],
      [
        "structure",
        data.episodes.length > 0
          ? `${data.episodes.length} حلقة`
          : `${data.seasons.length} موسم`,
      ],
      ["screenplay", `${data.scenes.length} مشهد`],
    ]);
  }, [data]);

  function toggleSection(sectionId: ProjectDossierSectionId): void {
    setSelectedSections((current) =>
      current.includes(sectionId)
        ? current.filter((id) => id !== sectionId)
        : sectionOptions
            .map((option) => option.id)
            .filter((id) => id === sectionId || current.includes(id)),
    );
  }

  async function exportPdf(): Promise<void> {
    if (data === null || isExporting) {
      return;
    }

    if (selectedSections.length === 0) {
      setError("اختر قسمًا واحدًا على الأقل للتصدير.");
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      await exportProjectDossierToPdf({
        project,
        story: data.story,
        characters: data.characters,
        locations: data.locations,
        seasons: data.seasons,
        episodes: data.episodes,
        scenes: data.scenes,
        elementsByScene: data.elementsByScene,
        sections: selectedSections,
        showCover,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : String(caughtError),
      );
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="export-workspace export-workspace--state" dir="rtl">
        جارٍ تجهيز بيانات التصدير...
      </main>
    );
  }

  if (data === null) {
    return (
      <main className="export-workspace export-workspace--state" dir="rtl">
        <h2>تعذر تجهيز التصدير</h2>
        <p>{error ?? "تعذر تحميل بيانات المشروع."}</p>
      </main>
    );
  }

  const allSelected =
    selectedSections.length === sectionOptions.length;

  return (
    <main className="export-workspace" dir="rtl">
      <header className="export-workspace-header">
        <div>
          <span>التصدير</span>
          <h1>ملف المشروع الدرامي</h1>
          <p>
            اختر أقسام المشروع التي تريد جمعها في ملف PDF واحد. لا يغيّر هذا
            التصدير بيانات المشروع ولا إعدادات تصدير السيناريو الحالية.
          </p>
        </div>

        <div className="export-workspace-summary">
          <small>المشروع</small>
          <strong>{project.title}</strong>
          <span>{selectedSections.length} / {sectionOptions.length} أقسام</span>
        </div>
      </header>

      {error !== null && (
        <div className="export-workspace-feedback" role="alert">
          {error}
        </div>
      )}

      <section className="export-workspace-card">
        <div className="export-workspace-card-heading">
          <div>
            <span>المحتوى</span>
            <p>يمكن استبعاد أي قسم من الملف النهائي.</p>
          </div>

          <button
            type="button"
            className="export-workspace-text-button"
            onClick={() => {
              setSelectedSections(allSelected ? [] : defaultSections);
              setError(null);
            }}
          >
            {allSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
          </button>
        </div>

        <div className="export-section-list">
          {sectionOptions.map((option) => {
            const isSelected = selectedSections.includes(option.id);

            return (
              <label
                key={option.id}
                className={
                  isSelected
                    ? "export-section-option is-selected"
                    : "export-section-option"
                }
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    toggleSection(option.id);
                    setError(null);
                  }}
                />

                <span className="export-section-check" aria-hidden="true">
                  {isSelected ? "✓" : ""}
                </span>

                <span className="export-section-copy">
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>

                <span className="export-section-count">
                  {sectionCounts.get(option.id) ?? "—"}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="export-workspace-card">
        <div className="export-workspace-card-heading">
          <div>
            <span>إعداد الملف</span>
            <p>في هذه المرحلة يتم إنشاء ملف PDF موحد.</p>
          </div>
        </div>

        <label className="export-cover-option">
          <input
            type="checkbox"
            checked={showCover}
            onChange={(event) => setShowCover(event.target.checked)}
          />
          <span>
            <strong>إضافة غلاف</strong>
            <small>
              يستعمل عنوان المشروع والعنوان الفرعي واسم الكاتب من إعدادات المشروع.
            </small>
          </span>
        </label>

        <div className="export-format-row">
          <span>صيغة الإخراج</span>
          <strong>PDF · A4 · اتجاه عربي من اليمين إلى اليسار</strong>
        </div>
      </section>

      <footer className="export-workspace-actions">
        <div>
          <strong>ملف واحد</strong>
          <span>سيظهر مربع الطباعة لحفظ النسخة بصيغة PDF.</span>
        </div>

        <button
          type="button"
          className="export-workspace-primary"
          disabled={isExporting || selectedSections.length === 0}
          onClick={() => void exportPdf()}
        >
          {isExporting ? "جارٍ تجهيز الملف..." : "تصدير ملف المشروع PDF"}
        </button>
      </footer>
    </main>
  );
}

function countStoryFields(story: ProjectStory): string {
  const values = [
    story.premise,
    story.logline,
    story.synopsis,
    story.themes,
    story.centralConflict,
    story.startingPoint,
    story.expectedDirection,
    story.writerNotes,
  ];

  return String(values.filter((value) => value.trim()).length);
}
