
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  Episode,
  EpisodeStatus,
  Project,
  Season,
} from "../../types";

import type {
  UpdateEpisodeInput,
  UpdateSeasonInput,
} from "../../application";

import {
  useProjectStructure,
} from "./useProjectStructure";

import "./structure-workspace.css";

interface ProjectStructureWorkspaceProps {
  project: Project;
  onFirstEpisodeCreated?: (episode: Episode) => void;
}

type EditorMode = "season" | "episode";

interface SeasonFormState {
  number: string;
  title: string;
  description: string;
  plannedEpisodeCount: string;
  defaultEpisodeDurationMinutes: string;
}

interface EpisodeFormState {
  seasonId: string;
  number: string;
  title: string;
  synopsis: string;
  notes: string;
  targetDurationMinutes: string;
  estimatedDurationSeconds: string;
  status: EpisodeStatus;
}

const emptySeasonForm: SeasonFormState = {
  number: "",
  title: "",
  description: "",
  plannedEpisodeCount: "",
  defaultEpisodeDurationMinutes: "",
};

const emptyEpisodeForm: EpisodeFormState = {
  seasonId: "",
  number: "",
  title: "",
  synopsis: "",
  notes: "",
  targetDurationMinutes: "",
  estimatedDurationSeconds: "",
  status: "outline",
};

export function ProjectStructureWorkspace({
  project,
  onFirstEpisodeCreated,
}: ProjectStructureWorkspaceProps) {
  const {
    seasons,
    episodes,
    isLoading,
    isSaving,
    error,
    createSeason,
    updateSeason,
    deleteSeason,
    createEpisode,
    updateEpisode,
    deleteEpisode,
    clearError,
  } = useProjectStructure(project.id);

  const isSeries = project.projectType === "series";
  const isMultiSeasonSeries =
    isSeries &&
    project.seriesStructure === "multi_season";

  const isDirectEpisodeStructure =
    project.projectType === "single_episode" ||
    (isSeries && !isMultiSeasonSeries);

  const [selectedSeasonId, setSelectedSeasonId] =
    useState<string | null>(null);

  const [selectedEpisodeId, setSelectedEpisodeId] =
    useState<string | null>(null);

  const [editorMode, setEditorMode] =
    useState<EditorMode>(
      isMultiSeasonSeries ? "season" : "episode",
    );

  const [seasonForm, setSeasonForm] =
    useState<SeasonFormState>({ ...emptySeasonForm });

  const [savedSeasonForm, setSavedSeasonForm] =
    useState<SeasonFormState>({ ...emptySeasonForm });

  const [episodeForm, setEpisodeForm] =
    useState<EpisodeFormState>({ ...emptyEpisodeForm });

  const [savedEpisodeForm, setSavedEpisodeForm] =
    useState<EpisodeFormState>({ ...emptyEpisodeForm });

  const selectedSeason =
    seasons.find((season) => season.id === selectedSeasonId) ?? null;

  const selectedEpisode =
    episodes.find((episode) => episode.id === selectedEpisodeId) ?? null;

  const displayedEpisodes = useMemo(() => {
    if (isDirectEpisodeStructure) {
      return episodes.filter((episode) => episode.seasonId === null);
    }

    if (!isMultiSeasonSeries || selectedSeasonId === null) {
      return [];
    }

    return episodes.filter(
      (episode) => episode.seasonId === selectedSeasonId,
    );
  }, [
    episodes,
    isDirectEpisodeStructure,
    isMultiSeasonSeries,
    selectedSeasonId,
  ]);

  const isSingleEpisodeComplete =
    project.projectType === "single_episode" &&
    displayedEpisodes.length >= 1;

  const isSeasonDirty =
    JSON.stringify(seasonForm) !== JSON.stringify(savedSeasonForm);

  const isEpisodeDirty =
    JSON.stringify(episodeForm) !== JSON.stringify(savedEpisodeForm);

  const isDirty =
    editorMode === "season" ? isSeasonDirty : isEpisodeDirty;

  useEffect(() => {
    setSelectedSeasonId(null);
    setSelectedEpisodeId(null);
    setEditorMode(isMultiSeasonSeries ? "season" : "episode");
    setSeasonForm({ ...emptySeasonForm });
    setSavedSeasonForm({ ...emptySeasonForm });
    setEpisodeForm({ ...emptyEpisodeForm });
    setSavedEpisodeForm({ ...emptyEpisodeForm });
  }, [project.id, isMultiSeasonSeries]);

  useEffect(() => {
    if (
      !isMultiSeasonSeries ||
      seasons.length === 0 ||
      selectedSeasonId !== null
    ) {
      return;
    }

    setSelectedSeasonId(seasons[0].id);
  }, [isMultiSeasonSeries, seasons, selectedSeasonId]);

  useEffect(() => {
    if (!isDirectEpisodeStructure || isLoading) {
      return;
    }

    const directEpisodes = episodes.filter(
      (episode) => episode.seasonId === null,
    );

    if (
      selectedEpisodeId === null &&
      episodeForm.number === "" &&
      directEpisodes.length > 0
    ) {
      const firstEpisode = directEpisodes[0];
      const nextForm = episodeToForm(firstEpisode);

      setSelectedEpisodeId(firstEpisode.id);
      setEditorMode("episode");
      setEpisodeForm(nextForm);
      setSavedEpisodeForm(nextForm);
      return;
    }

    if (
      directEpisodes.length === 0 &&
      selectedEpisodeId === null &&
      episodeForm.number === ""
    ) {
      const nextForm = createNewEpisodeForm(
        episodes,
        null,
        project.defaultEpisodeDurationMinutes ?? 52,
      );

      setEditorMode("episode");
      setEpisodeForm(nextForm);
      setSavedEpisodeForm({ ...emptyEpisodeForm });
    }
  }, [
    episodes,
    episodeForm.number,
    isDirectEpisodeStructure,
    isLoading,
    project.defaultEpisodeDurationMinutes,
    selectedEpisodeId,
  ]);

  useEffect(() => {
    if (selectedSeason === null) {
      return;
    }

    const nextForm = seasonToForm(selectedSeason);
    setSeasonForm(nextForm);
    setSavedSeasonForm(nextForm);
  }, [selectedSeason]);

  useEffect(() => {
    if (selectedEpisode === null) {
      return;
    }

    const nextForm = episodeToForm(selectedEpisode);
    setEpisodeForm(nextForm);
    setSavedEpisodeForm(nextForm);
  }, [selectedEpisode]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const isSaveShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.key.toLocaleLowerCase() === "s";

      if (!isSaveShortcut || !isDirty || isSaving) {
        return;
      }

      event.preventDefault();

      if (editorMode === "season") {
        void saveSeason();
      } else {
        void saveEpisode();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    editorMode,
    isDirty,
    isSaving,
    seasonForm,
    episodeForm,
    selectedSeason,
    selectedEpisode,
    isMultiSeasonSeries,
  ]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent): void {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  function confirmDiscardChanges(): boolean {
    if (!isDirty) {
      return true;
    }

    return window.confirm(
      "توجد تغييرات غير محفوظة.\n\nهل تريد تجاهلها والمتابعة؟",
    );
  }

  function startNewSeason(): void {
    if (!isMultiSeasonSeries || !confirmDiscardChanges()) {
      return;
    }

    clearError();
    setEditorMode("season");
    setSelectedSeasonId(null);
    setSelectedEpisodeId(null);

    const nextForm: SeasonFormState = {
      ...emptySeasonForm,
      number: String(getNextSeasonNumber(seasons)),
      defaultEpisodeDurationMinutes:
        project.defaultEpisodeDurationMinutes === null
          ? ""
          : String(project.defaultEpisodeDurationMinutes),
    };

    setSeasonForm(nextForm);
    setSavedSeasonForm({ ...emptySeasonForm });
  }

  function selectSeason(season: Season): void {
    if (!confirmDiscardChanges()) {
      return;
    }

    clearError();
    setEditorMode("season");
    setSelectedSeasonId(season.id);
    setSelectedEpisodeId(null);

    const nextForm = seasonToForm(season);
    setSeasonForm(nextForm);
    setSavedSeasonForm(nextForm);
  }

  function startNewEpisode(): void {
    if (isSingleEpisodeComplete || !confirmDiscardChanges()) {
      return;
    }

    clearError();

    const seasonId =
      isMultiSeasonSeries ? selectedSeasonId : null;

    if (isMultiSeasonSeries && seasonId === null) {
      return;
    }

    const duration =
      selectedSeason?.defaultEpisodeDurationMinutes ??
      project.defaultEpisodeDurationMinutes ??
      52;

    const nextForm = createNewEpisodeForm(
      episodes,
      seasonId,
      duration,
    );

    setEditorMode("episode");
    setSelectedEpisodeId(null);
    setEpisodeForm(nextForm);
    setSavedEpisodeForm({ ...emptyEpisodeForm });
  }

  function selectEpisode(episode: Episode): void {
    if (!confirmDiscardChanges()) {
      return;
    }

    clearError();
    setEditorMode("episode");
    setSelectedEpisodeId(episode.id);

    if (isMultiSeasonSeries && episode.seasonId !== null) {
      setSelectedSeasonId(episode.seasonId);
    }

    const nextForm = episodeToForm(episode);
    setEpisodeForm(nextForm);
    setSavedEpisodeForm(nextForm);
  }

  async function saveSeason(): Promise<void> {
    if (!isMultiSeasonSeries) {
      return;
    }

    const number = parsePositiveInteger(seasonForm.number);

    if (number === null || isSaving) {
      return;
    }

    const plannedEpisodeCount = parseOptionalPositiveInteger(
      seasonForm.plannedEpisodeCount,
    );

    const defaultDuration = parseOptionalPositiveInteger(
      seasonForm.defaultEpisodeDurationMinutes,
    );

    if (selectedSeason === null) {
      const createdSeason = await createSeason({
        number,
        title: seasonForm.title,
        description: seasonForm.description,
        plannedEpisodeCount,
        defaultEpisodeDurationMinutes: defaultDuration,
      });

      if (createdSeason !== null) {
        setSelectedSeasonId(createdSeason.id);

        const nextForm = seasonToForm(createdSeason);
        setSeasonForm(nextForm);
        setSavedSeasonForm(nextForm);
      }

      return;
    }

    const input: UpdateSeasonInput = {
      number,
      title: seasonForm.title || null,
      description: seasonForm.description || null,
      plannedEpisodeCount,
      defaultEpisodeDurationMinutes: defaultDuration,
      orderIndex: selectedSeason.orderIndex,
    };

    const updatedSeason = await updateSeason(selectedSeason.id, input);

    if (updatedSeason !== null) {
      const nextForm = seasonToForm(updatedSeason);
      setSeasonForm(nextForm);
      setSavedSeasonForm(nextForm);
    }
  }

  async function saveEpisode(): Promise<void> {
    const number = parsePositiveInteger(episodeForm.number);
    const duration = parsePositiveInteger(
      episodeForm.targetDurationMinutes,
    );

    if (number === null || duration === null || isSaving) {
      return;
    }

    const seasonId =
      isMultiSeasonSeries ? episodeForm.seasonId || null : null;

    if (isMultiSeasonSeries && seasonId === null) {
      return;
    }

    const estimatedDurationSeconds =
      parseOptionalNonNegativeInteger(
        episodeForm.estimatedDurationSeconds,
      );

    if (selectedEpisode === null) {
      const createdEpisode = await createEpisode({
        seasonId,
        number,
        title: episodeForm.title,
        synopsis: episodeForm.synopsis,
        notes: episodeForm.notes,
        targetDurationMinutes: duration,
        status: episodeForm.status,
      });

      if (createdEpisode !== null) {
        const isFirstEpisode =
          episodes.length === 0;

        setSelectedEpisodeId(createdEpisode.id);

        const nextForm = episodeToForm(createdEpisode);
        setEpisodeForm(nextForm);
        setSavedEpisodeForm(nextForm);

        if (isFirstEpisode) {
          onFirstEpisodeCreated?.(createdEpisode);
        }
      }

      return;
    }

    const input: UpdateEpisodeInput = {
      seasonId,
      number,
      title: episodeForm.title || null,
      synopsis: episodeForm.synopsis || null,
      notes: episodeForm.notes || null,
      targetDurationMinutes: duration,
      estimatedDurationSeconds,
      status: episodeForm.status,
      orderIndex: selectedEpisode.orderIndex,
    };

    const updatedEpisode = await updateEpisode(selectedEpisode.id, input);

    if (updatedEpisode !== null) {
      const nextForm = episodeToForm(updatedEpisode);
      setEpisodeForm(nextForm);
      setSavedEpisodeForm(nextForm);
    }
  }

  async function handleSeasonDelete(): Promise<void> {
    if (selectedSeason === null) {
      return;
    }

    const seasonEpisodes = episodes.filter(
      (episode) => episode.seasonId === selectedSeason.id,
    );

    const warning =
      seasonEpisodes.length > 0
        ? `\n\nسيُحذف معه ${seasonEpisodes.length} من الحلقات.`
        : "";

    const confirmed = window.confirm(
      `هل تريد حذف الموسم ${selectedSeason.number}؟${warning}\n\nلن يمكن التراجع عن هذا الإجراء.`,
    );

    if (!confirmed) {
      return;
    }

    const deleted = await deleteSeason(selectedSeason.id);

    if (deleted) {
      setSelectedSeasonId(null);
      setSelectedEpisodeId(null);
      setSeasonForm({ ...emptySeasonForm });
      setSavedSeasonForm({ ...emptySeasonForm });
    }
  }

  async function handleEpisodeDelete(): Promise<void> {
    if (selectedEpisode === null) {
      return;
    }

    const confirmed = window.confirm(
      `هل تريد حذف الحلقة ${selectedEpisode.number}؟\n\nلن يمكن التراجع عن هذا الإجراء.`,
    );

    if (!confirmed) {
      return;
    }

    const deleted = await deleteEpisode(selectedEpisode.id);

    if (deleted) {
      setSelectedEpisodeId(null);

      const remainingEpisodes = displayedEpisodes.filter(
        (episode) => episode.id !== selectedEpisode.id,
      );

      if (remainingEpisodes.length > 0) {
        const nextEpisode = remainingEpisodes[0];
        const nextForm = episodeToForm(nextEpisode);

        setSelectedEpisodeId(nextEpisode.id);
        setEpisodeForm(nextForm);
        setSavedEpisodeForm(nextForm);
      } else {
        const seasonId =
          isMultiSeasonSeries ? selectedSeasonId : null;

        const duration =
          selectedSeason?.defaultEpisodeDurationMinutes ??
          project.defaultEpisodeDurationMinutes ??
          52;

        const nextForm = createNewEpisodeForm(
          episodes.filter(
            (episode) => episode.id !== selectedEpisode.id,
          ),
          seasonId,
          duration,
        );

        setEpisodeForm(nextForm);
        setSavedEpisodeForm({ ...emptyEpisodeForm });
      }
    }
  }

  if (
    project.projectType !== "series" &&
    project.projectType !== "single_episode"
  ) {
    return (
      <main className="structure-workspace" dir="rtl">
        <header className="structure-header">
          <div>
            <span className="structure-kicker">{project.title}</span>
            <h1>بنية العمل</h1>
            <p>
              ستُبنى بنية هذا النوع من المشاريع عند تطوير الفصول
              والوحدات الدرامية.
            </p>
          </div>
        </header>

        <section className="structure-unavailable">
          وحدة المواسم والحلقات مخصصة حاليًا للمسلسل والحلقة المنفردة.
        </section>
      </main>
    );
  }

  return (
    <main className="structure-workspace" dir="rtl">
      <header className="structure-header">
        <div>
          <span className="structure-kicker">{project.title}</span>
          <h1>{getStructureTitle(project, isMultiSeasonSeries)}</h1>
          <p>{getStructureDescription(project, isMultiSeasonSeries)}</p>
        </div>

        <div className="structure-header-actions">
          {isMultiSeasonSeries && (
            <button
              type="button"
              className="structure-secondary-button"
              onClick={startNewSeason}
            >
              موسم جديد
            </button>
          )}

          <button
            type="button"
            className="structure-primary-button"
            disabled={
              (isMultiSeasonSeries && selectedSeasonId === null) ||
              isSingleEpisodeComplete
            }
            onClick={startNewEpisode}
          >
            {project.projectType === "single_episode"
              ? "إنشاء الحلقة"
              : "حلقة جديدة"}
          </button>
        </div>
      </header>

      {error !== null && (
        <div className="structure-error" role="alert">
          {error}
        </div>
      )}

      <div
        className={
          isMultiSeasonSeries
            ? "structure-layout structure-layout--with-seasons"
            : "structure-layout structure-layout--direct"
        }
      >
        {isMultiSeasonSeries && (
          <aside className="structure-seasons-panel">
            <div className="structure-panel-heading">
              <strong>المواسم</strong>
              <span>{seasons.length}</span>
            </div>

            {isLoading ? (
              <div className="structure-empty">جارٍ تحميل المواسم...</div>
            ) : seasons.length === 0 ? (
              <div className="structure-empty">لم يُنشأ أي موسم بعد.</div>
            ) : (
              <div className="structure-season-list">
                {seasons.map((season) => {
                  const episodeCount = episodes.filter(
                    (episode) => episode.seasonId === season.id,
                  ).length;

                  return (
                    <button
                      key={season.id}
                      type="button"
                      className={
                        season.id === selectedSeasonId
                          ? "structure-season-item is-active"
                          : "structure-season-item"
                      }
                      onClick={() => {
                        selectSeason(season);
                      }}
                    >
                      <strong>الموسم {season.number}</strong>
                      <span>{season.title ?? "دون عنوان"}</span>
                      <small>{episodeCount} حلقة</small>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>
        )}

        <section className="structure-episodes-panel">
          <div className="structure-panel-heading">
            <strong>
              {project.projectType === "single_episode"
                ? "الحلقة"
                : "الحلقات"}
            </strong>
            <span>{displayedEpisodes.length}</span>
          </div>

          {isLoading ? (
            <div className="structure-empty">جارٍ تحميل الحلقات...</div>
          ) : displayedEpisodes.length === 0 ? (
            <div className="structure-empty">
              {isMultiSeasonSeries && selectedSeasonId === null
                ? "اختر موسمًا أو أنشئ موسمًا جديدًا أولًا."
                : "لا توجد حلقات في هذا القسم."}
            </div>
          ) : (
            <div className="structure-episode-list">
              {displayedEpisodes.map((episode) => (
                <button
                  key={episode.id}
                  type="button"
                  className={
                    episode.id === selectedEpisodeId
                      ? "structure-episode-item is-active"
                      : "structure-episode-item"
                  }
                  onClick={() => {
                    selectEpisode(episode);
                  }}
                >
                  <span className="structure-episode-number">
                    {episode.number}
                  </span>

                  <span className="structure-episode-copy">
                    <strong>
                      {episode.title ?? `الحلقة ${episode.number}`}
                    </strong>
                    <small>
                      {getEpisodeStatusLabel(episode.status)}
                      {" · "}
                      {episode.targetDurationMinutes} دقيقة
                    </small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="structure-editor-panel">
          <div className="structure-editor-heading">
            <div>
              <span>
                {editorMode === "season" ? "بيانات الموسم" : "بيانات الحلقة"}
              </span>
              <h2>
                {editorMode === "season"
                  ? selectedSeason?.title ?? "موسم جديد"
                  : selectedEpisode?.title ?? "حلقة جديدة"}
              </h2>
            </div>

            <div className="structure-editor-actions">
              <span
                className={
                  isDirty
                    ? "structure-save-status is-dirty"
                    : "structure-save-status"
                }
              >
                {isSaving
                  ? "جارٍ الحفظ..."
                  : isDirty
                    ? "تغييرات غير محفوظة"
                    : "جميع التغييرات محفوظة"}
              </span>

              {editorMode === "season" && selectedSeason !== null && (
                <button
                  type="button"
                  className="structure-danger-button"
                  disabled={isSaving}
                  onClick={() => {
                    void handleSeasonDelete();
                  }}
                >
                  حذف الموسم
                </button>
              )}

              {editorMode === "episode" && selectedEpisode !== null && (
                <button
                  type="button"
                  className="structure-danger-button"
                  disabled={isSaving}
                  onClick={() => {
                    void handleEpisodeDelete();
                  }}
                >
                  حذف الحلقة
                </button>
              )}
            </div>
          </div>

          {editorMode === "season" && isMultiSeasonSeries ? (
            <SeasonEditor
              form={seasonForm}
              isSaving={isSaving}
              isDirty={isSeasonDirty}
              onChange={(changes) => {
                clearError();
                setSeasonForm((currentForm) => ({
                  ...currentForm,
                  ...changes,
                }));
              }}
              onReset={() => {
                setSeasonForm({ ...savedSeasonForm });
              }}
              onSubmit={() => {
                void saveSeason();
              }}
            />
          ) : (
            <EpisodeEditor
              showSeasonField={isMultiSeasonSeries}
              seasons={seasons}
              form={episodeForm}
              isSaving={isSaving}
              isDirty={isEpisodeDirty}
              onChange={(changes) => {
                clearError();
                setEpisodeForm((currentForm) => ({
                  ...currentForm,
                  ...changes,
                }));
              }}
              onReset={() => {
                setEpisodeForm({ ...savedEpisodeForm });
              }}
              onSubmit={() => {
                void saveEpisode();
              }}
            />
          )}
        </section>
      </div>
    </main>
  );
}

interface SeasonEditorProps {
  form: SeasonFormState;
  isSaving: boolean;
  isDirty: boolean;
  onChange: (changes: Partial<SeasonFormState>) => void;
  onReset: () => void;
  onSubmit: () => void;
}

function SeasonEditor({
  form,
  isSaving,
  isDirty,
  onChange,
  onReset,
  onSubmit,
}: SeasonEditorProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="structure-form" onSubmit={handleSubmit}>
      <label>
        <span>رقم الموسم</span>
        <input
          type="number"
          min={1}
          required
          value={form.number}
          onChange={(event) => {
            onChange({ number: event.target.value });
          }}
        />
      </label>

      <label>
        <span>عنوان الموسم</span>
        <input
          type="text"
          value={form.title}
          placeholder="عنوان اختياري"
          onChange={(event) => {
            onChange({ title: event.target.value });
          }}
        />
      </label>

      <label>
        <span>عدد الحلقات المخطط</span>
        <input
          type="number"
          min={1}
          value={form.plannedEpisodeCount}
          placeholder="اختياري"
          onChange={(event) => {
            onChange({ plannedEpisodeCount: event.target.value });
          }}
        />
      </label>

      <label>
        <span>مدة الحلقة الافتراضية</span>
        <input
          type="number"
          min={1}
          value={form.defaultEpisodeDurationMinutes}
          placeholder="بالدقائق"
          onChange={(event) => {
            onChange({
              defaultEpisodeDurationMinutes: event.target.value,
            });
          }}
        />
      </label>

      <label className="structure-form-full">
        <span>وصف الموسم</span>
        <textarea
          rows={9}
          value={form.description}
          placeholder="الخط العام للموسم ومساره الدرامي..."
          onChange={(event) => {
            onChange({ description: event.target.value });
          }}
        />
      </label>

      <FormActions
        isSaving={isSaving}
        isDirty={isDirty}
        onReset={onReset}
        submitLabel="حفظ الموسم"
      />
    </form>
  );
}

interface EpisodeEditorProps {
  showSeasonField: boolean;
  seasons: Season[];
  form: EpisodeFormState;
  isSaving: boolean;
  isDirty: boolean;
  onChange: (changes: Partial<EpisodeFormState>) => void;
  onReset: () => void;
  onSubmit: () => void;
}

function EpisodeEditor({
  showSeasonField,
  seasons,
  form,
  isSaving,
  isDirty,
  onChange,
  onReset,
  onSubmit,
}: EpisodeEditorProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="structure-form" onSubmit={handleSubmit}>
      {showSeasonField && (
        <label>
          <span>الموسم</span>
          <select
            required
            value={form.seasonId}
            onChange={(event) => {
              onChange({ seasonId: event.target.value });
            }}
          >
            <option value="">اختر الموسم</option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                الموسم {season.number}
                {season.title ? ` — ${season.title}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <label>
        <span>رقم الحلقة</span>
        <input
          type="number"
          min={1}
          required
          value={form.number}
          onChange={(event) => {
            onChange({ number: event.target.value });
          }}
        />
      </label>

      <label>
        <span>عنوان الحلقة</span>
        <input
          type="text"
          value={form.title}
          placeholder="عنوان اختياري"
          onChange={(event) => {
            onChange({ title: event.target.value });
          }}
        />
      </label>

      <label>
        <span>الحالة</span>
        <select
          value={form.status}
          onChange={(event) => {
            onChange({ status: event.target.value as EpisodeStatus });
          }}
        >
          <option value="outline">مخطط أولي</option>
          <option value="draft">مسودة</option>
          <option value="review">قيد المراجعة</option>
          <option value="final">نهائية</option>
        </select>
      </label>

      <label>
        <span>المدة المستهدفة</span>
        <input
          type="number"
          min={1}
          required
          value={form.targetDurationMinutes}
          onChange={(event) => {
            onChange({ targetDurationMinutes: event.target.value });
          }}
        />
      </label>

      <label>
        <span>المدة التقديرية بالثواني</span>
        <input
          type="number"
          min={0}
          value={form.estimatedDurationSeconds}
          placeholder="تُحسب لاحقًا"
          onChange={(event) => {
            onChange({ estimatedDurationSeconds: event.target.value });
          }}
        />
      </label>

      <label className="structure-form-full">
        <span>ملخص الحلقة</span>
        <textarea
          rows={8}
          value={form.synopsis}
          placeholder="ملخص الأحداث والمسار الدرامي للحلقة..."
          onChange={(event) => {
            onChange({ synopsis: event.target.value });
          }}
        />
      </label>

      <label className="structure-form-full">
        <span>ملاحظات</span>
        <textarea
          rows={5}
          value={form.notes}
          placeholder="ملاحظات الكتابة والبناء..."
          onChange={(event) => {
            onChange({ notes: event.target.value });
          }}
        />
      </label>

      <FormActions
        isSaving={isSaving}
        isDirty={isDirty}
        onReset={onReset}
        submitLabel="حفظ الحلقة"
      />
    </form>
  );
}

interface FormActionsProps {
  isSaving: boolean;
  isDirty: boolean;
  onReset: () => void;
  submitLabel: string;
}

function FormActions({
  isSaving,
  isDirty,
  onReset,
  submitLabel,
}: FormActionsProps) {
  return (
    <div className="structure-form-actions">
      <button
        type="button"
        className="structure-secondary-button"
        disabled={isSaving || !isDirty}
        onClick={onReset}
      >
        التراجع عن التغييرات
      </button>

      <button
        type="submit"
        className="structure-primary-button"
        disabled={isSaving || !isDirty}
        title="حفظ — Ctrl + S"
      >
        {isSaving ? "جارٍ الحفظ..." : submitLabel}
      </button>
    </div>
  );
}

function seasonToForm(season: Season): SeasonFormState {
  return {
    number: String(season.number),
    title: season.title ?? "",
    description: season.description ?? "",
    plannedEpisodeCount:
      season.plannedEpisodeCount === null
        ? ""
        : String(season.plannedEpisodeCount),
    defaultEpisodeDurationMinutes:
      season.defaultEpisodeDurationMinutes === null
        ? ""
        : String(season.defaultEpisodeDurationMinutes),
  };
}

function episodeToForm(episode: Episode): EpisodeFormState {
  return {
    seasonId: episode.seasonId ?? "",
    number: String(episode.number),
    title: episode.title ?? "",
    synopsis: episode.synopsis ?? "",
    notes: episode.notes ?? "",
    targetDurationMinutes: String(episode.targetDurationMinutes),
    estimatedDurationSeconds:
      episode.estimatedDurationSeconds === null
        ? ""
        : String(episode.estimatedDurationSeconds),
    status: episode.status,
  };
}

function createNewEpisodeForm(
  episodes: Episode[],
  seasonId: string | null,
  duration: number,
): EpisodeFormState {
  return {
    ...emptyEpisodeForm,
    seasonId: seasonId ?? "",
    number: String(getNextEpisodeNumber(episodes, seasonId)),
    targetDurationMinutes: String(duration),
  };
}

function getNextSeasonNumber(seasons: Season[]): number {
  return (
    seasons.reduce(
      (maximum, season) => Math.max(maximum, season.number),
      0,
    ) + 1
  );
}

function getNextEpisodeNumber(
  episodes: Episode[],
  seasonId: string | null,
): number {
  return (
    episodes
      .filter((episode) => episode.seasonId === seasonId)
      .reduce(
        (maximum, episode) => Math.max(maximum, episode.number),
        0,
      ) + 1
  );
}

function parsePositiveInteger(value: string): number | null {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return null;
  }

  return parsedValue;
}

function parseOptionalPositiveInteger(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  return parsePositiveInteger(value);
}

function parseOptionalNonNegativeInteger(
  value: string,
): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

function getEpisodeStatusLabel(status: EpisodeStatus): string {
  switch (status) {
    case "outline":
      return "مخطط أولي";
    case "draft":
      return "مسودة";
    case "review":
      return "قيد المراجعة";
    case "final":
      return "نهائية";
  }
}

function getStructureTitle(
  project: Project,
  isMultiSeasonSeries: boolean,
): string {
  if (project.projectType === "single_episode") {
    return "بنية الحلقة";
  }

  return isMultiSeasonSeries
    ? "المواسم والحلقات"
    : "حلقات المسلسل";
}

function getStructureDescription(
  project: Project,
  isMultiSeasonSeries: boolean,
): string {
  if (project.projectType === "single_episode") {
    return "إعداد بيانات الحلقة المنفردة وملخصها وحالتها.";
  }

  if (isMultiSeasonSeries) {
    return "تنظيم المواسم وحلقات كل موسم ومتابعة حالتها.";
  }

  return "تنظيم حلقات المسلسل مباشرة دون إنشاء موسم صوري.";
}
