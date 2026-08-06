import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import {
  sceneElementService,
  type UpdateSceneInput,
} from "../../application";

import type {
  Character,
  InteriorExterior,
  Location,
  Project,
  Scene,
  SceneElement,
  SceneElementType,
  SceneStatus,
  TimeOfDay,
} from "../../types";

import {
  parseScreenplayText,
  type ParsedScreenplay,
} from "./screenplayTextImporter";
import { useScenesWorkspace } from "./useScenesWorkspace";
import {
  exportScreenplayToPdf,
  type ScreenplayPdfCoverOptions,
} from "./screenplayPdfExporter";
import "./scenes-workspace.css";
import "./screenplay-export-dialog.css";

interface ScenesWorkspaceProps {
  project: Project;
}

interface PdfCoverFormState extends ScreenplayPdfCoverOptions {}

interface DeletedSceneSnapshot {
  scene: Scene;
  elements: SceneElement[];
  originalIndex: number;
}

interface SceneFormState {
  episodeId: string;
  locationId: string;
  sceneNumber: string;
  title: string;
  interiorExterior: InteriorExterior;
  timeOfDay: TimeOfDay;
  customTimeOfDay: string;
  synopsis: string;
  dramaticPurpose: string;
  notes: string;
  estimatedDurationSeconds: string;
  status: SceneStatus;
}

const emptySceneForm: SceneFormState = {
  episodeId: "",
  locationId: "",
  sceneNumber: "",
  title: "",
  interiorExterior: "unspecified",
  timeOfDay: "unspecified",
  customTimeOfDay: "",
  synopsis: "",
  dramaticPurpose: "",
  notes: "",
  estimatedDurationSeconds: "",
  status: "draft",
};

const toolbarTypes: { type: SceneElementType; label: string }[] = [
  { type: "action", label: "وصف" },
  { type: "character", label: "شخصية" },
  { type: "dialogue", label: "حوار" },
  { type: "parenthetical", label: "حالة حوار" },
  { type: "transition", label: "انتقال" },
  { type: "note", label: "ملاحظة" },
];

const cycleTypes: SceneElementType[] = [
  "action",
  "character",
  "dialogue",
  "parenthetical",
  "transition",
];

const directTypeShortcuts: Readonly<
  Record<string, SceneElementType>
> = {
  "1": "action",
  "2": "character",
  "3": "dialogue",
  "4": "parenthetical",
  "5": "transition",
  "6": "note",
};

const timeOfDayOptions: { value: TimeOfDay; label: string }[] = [
  { value: "unspecified", label: "غير محدد" },
  { value: "day", label: "نهار" },
  { value: "night", label: "ليل" },
  { value: "morning", label: "صباح" },
  { value: "evening", label: "مساء" },
  { value: "dawn", label: "فجر" },
  { value: "sunset", label: "غروب" },
  { value: "continuous", label: "استمرار" },
  { value: "later", label: "لاحقًا" },
  { value: "custom", label: "زمن خاص" },
];

const transitionOptions: readonly string[] = [
  "قطع إلى:",
  "قطع مباشر إلى:",
  "مزج إلى:",
  "إظلام:",
  "ظهور تدريجي:",
  "اختفاء تدريجي:",
  "عودة إلى:",
  "نهاية المشهد",
  "نهاية الحلقة",
];

export function ScenesWorkspace({ project }: ScenesWorkspaceProps) {
  const {
    scenes,
    episodes,
    locations,
    characters,
    usesEpisodes,
    isLoading,
    isSaving,
    error,
    createScene,
    updateScene,
    hideSceneLocally,
    restoreSceneLocally,
    commitSceneDeletion,
    reorderScenes,
    createQuickEpisode,
    createQuickCharacter,
    createQuickLocation,
    reloadEpisodes,
  } = useScenesWorkspace(project);

  const [activeEpisodeId, setActiveEpisodeId] = useState("");
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [elementsByScene, setElementsByScene] = useState<Record<string, SceneElement[]>>({});
  const [dirtyElementIds, setDirtyElementIds] = useState<Set<string>>(new Set());
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [isScenesOpen, setIsScenesOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving" | "error">("saved");
  const [interactionError, setInteractionError] =
    useState<string | null>(null);
  const [
    deletedSceneSnapshot,
    setDeletedSceneSnapshot,
  ] = useState<DeletedSceneSnapshot | null>(null);
  const [form, setForm] = useState<SceneFormState>({ ...emptySceneForm });
  const [savedForm, setSavedForm] = useState<SceneFormState>({ ...emptySceneForm });
  const [draggedSceneId, setDraggedSceneId] =
    useState<string | null>(null);
  const [dragTarget, setDragTarget] =
    useState<{
      sceneId: string;
      placement: "before" | "after";
    } | null>(null);
  const [isPointerDragging, setIsPointerDragging] =
    useState(false);
  const [isImportOpen, setIsImportOpen] =
    useState(false);
  const [importSource, setImportSource] =
    useState("");
  const [importPreview, setImportPreview] =
    useState<ParsedScreenplay | null>(null);
  const [isImporting, setIsImporting] =
    useState(false);
  const [isEpisodeCreatorOpen, setIsEpisodeCreatorOpen] =
    useState(false);
  const [newEpisodeNumber, setNewEpisodeNumber] =
    useState("");
  const [newEpisodeTitle, setNewEpisodeTitle] =
    useState("");
  const [isCreatingEpisode, setIsCreatingEpisode] =
    useState(false);
  const [isCharacterPanelOpen, setIsCharacterPanelOpen] =
    useState(false);
  const [characterSearch, setCharacterSearch] =
    useState("");
  const [isCharacterCreatorOpen, setIsCharacterCreatorOpen] =
    useState(false);
  const [newCharacterName, setNewCharacterName] =
    useState("");
  const [newCharacterShortName, setNewCharacterShortName] =
    useState("");
  const [newCharacterNotes, setNewCharacterNotes] =
    useState("");
  const [isCreatingCharacter, setIsCreatingCharacter] =
    useState(false);
  const [isExportingPdf, setIsExportingPdf] =
    useState(false);
  const [isPdfExportDialogOpen, setIsPdfExportDialogOpen] =
    useState(false);
  const [pdfCoverForm, setPdfCoverForm] =
    useState<PdfCoverFormState>(() => loadPdfCoverForm(project));

  const sceneRefs = useRef<Map<string, HTMLElement>>(new Map());
  const headingRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const saveInFlightRef = useRef(false);
  const databaseWriteQueueRef = useRef<Promise<void>>(Promise.resolve());
  const elementInsertionInFlightRef = useRef(false);
  const sceneCreationInFlightRef = useRef(false);
  const deletedSceneCommitInFlightRef =
    useRef(false);
  const deletedSceneTimerRef =
    useRef<number | null>(null);
  const pointerDragRef = useRef<{
    pointerId: number;
    sceneId: string;
    startX: number;
    startY: number;
    didMove: boolean;
  } | null>(null);
  const dragTargetRef = useRef<{
    sceneId: string;
    placement: "before" | "after";
  } | null>(null);

  const visibleScenes = useMemo(() => {
    if (!usesEpisodes || !activeEpisodeId) {
      return scenes.filter((scene) => scene.episodeId === null);
    }

    return scenes.filter(
      (scene) =>
        scene.episodeId === activeEpisodeId,
    );
  }, [
    scenes,
    usesEpisodes,
    activeEpisodeId,
  ]);

  const activeScene = visibleScenes.find((scene) => scene.id === activeSceneId) ?? null;
  const activeElements = activeSceneId ? elementsByScene[activeSceneId] ?? [] : [];
  const activeElement = activeElements.find((element) => element.id === activeElementId) ?? null;

  const characterUsageById = useMemo(() => {
    const usage = new Map<string, Set<string>>();

    for (const scene of visibleScenes) {
      for (const element of elementsByScene[scene.id] ?? []) {
        if (!element.characterId) {
          continue;
        }

        const sceneIds = usage.get(element.characterId) ?? new Set<string>();
        sceneIds.add(scene.id);
        usage.set(element.characterId, sceneIds);
      }
    }

    return usage;
  }, [visibleScenes, elementsByScene]);

  const filteredCharacters = useMemo(() => {
    const query = normalizeImportedEntityName(characterSearch);

    return [...characters]
      .filter((character) => {
        if (!query) {
          return true;
        }

        return (
          normalizeImportedEntityName(character.name).includes(query) ||
          normalizeImportedEntityName(character.shortName ?? "").includes(query)
        );
      })
      .sort((first, second) => {
        const firstUsed = characterUsageById.has(first.id) ? 1 : 0;
        const secondUsed = characterUsageById.has(second.id) ? 1 : 0;

        return (
          secondUsed - firstUsed ||
          first.orderIndex - second.orderIndex ||
          first.name.localeCompare(second.name, "ar")
        );
      });
  }, [characters, characterSearch, characterUsageById]);

  const isSceneDirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const hasUnsavedChanges = isSceneDirty || dirtyElementIds.size > 0;

  useEffect(() => {
    if (!usesEpisodes || activeEpisodeId || episodes.length === 0) {
      return;
    }

    setActiveEpisodeId(episodes[0].id);
  }, [usesEpisodes, activeEpisodeId, episodes]);

  useEffect(() => {
    let cancelled = false;

    async function loadDocument(): Promise<void> {
      setIsLoadingDocument(true);

      try {
        const entries: Array<readonly [string, SceneElement[]]> = [];

        for (const scene of visibleScenes) {
          const elements = await sceneElementService.listElements(scene.id);
          entries.push([
            scene.id,
            [...elements].sort((a, b) => a.orderIndex - b.orderIndex),
          ] as const);
        }

        if (!cancelled) {
          setElementsByScene(Object.fromEntries(entries));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDocument(false);
        }
      }
    }

    void loadDocument();

    if (visibleScenes.length > 0 && !visibleScenes.some((scene) => scene.id === activeSceneId)) {
      setActiveSceneId(visibleScenes[0].id);
    }

    if (visibleScenes.length === 0) {
      setActiveSceneId(null);
    }

    return () => {
      cancelled = true;
    };
  }, [visibleScenes.map((scene) => scene.id).join("|")]);

  useEffect(() => {
    if (activeScene === null) {
      setForm({ ...emptySceneForm, episodeId: usesEpisodes ? activeEpisodeId : "" });
      setSavedForm({ ...emptySceneForm, episodeId: usesEpisodes ? activeEpisodeId : "" });
      return;
    }

    const nextForm = sceneToForm(activeScene);
    setForm(nextForm);
    setSavedForm(nextForm);
  }, [activeScene?.id]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      setSaveState("saved");
      return;
    }

    setSaveState("dirty");
    const timer = window.setTimeout(() => {
      void saveAll();
    }, 900);

    return () => window.clearTimeout(timer);
  }, [form, elementsByScene, dirtyElementIds]);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent): void {
      const modifier = event.ctrlKey || event.metaKey;

      if (modifier && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveAll();
      }

      if (event.key === "Escape" && isFocusMode) {
        setIsFocusMode(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [form, elementsByScene, dirtyElementIds, activeScene, isFocusMode]);


  useEffect(() => {
    return () => {
      if (
        deletedSceneTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          deletedSceneTimerRef.current,
        );
      }
    };
  }, []);

  function enqueueDatabaseWrite<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    const queuedOperation = databaseWriteQueueRef.current.then(
      operation,
      operation,
    );

    databaseWriteQueueRef.current = queuedOperation.then(
      () => undefined,
      () => undefined,
    );

    return queuedOperation;
  }

  async function saveAll(): Promise<void> {
    if (saveInFlightRef.current || isSaving || !hasUnsavedChanges) {
      return;
    }

    saveInFlightRef.current = true;
    setSaveState("saving");

    setInteractionError(null);

    try {
      await enqueueDatabaseWrite(async () => {
        if (activeScene && isSceneDirty) {
          const locationName = getLocationName(locations, form.locationId);
          const heading = buildSceneHeading(
            form.interiorExterior,
            locationName,
            form.timeOfDay,
            form.customTimeOfDay,
          );

          const input: UpdateSceneInput = {
            episodeId: usesEpisodes ? form.episodeId || null : null,
            locationId: form.locationId || null,
            sceneNumber: form.sceneNumber,
            title: form.title || null,
            heading,
            interiorExterior: form.interiorExterior,
            timeOfDay: form.timeOfDay,
            customTimeOfDay: form.customTimeOfDay || null,
            synopsis: form.synopsis || null,
            dramaticPurpose: form.dramaticPurpose || null,
            notes: form.notes || null,
            estimatedDurationSeconds: parseOptionalNonNegativeInteger(form.estimatedDurationSeconds),
            status: form.status,
            orderIndex: activeScene.orderIndex,
          };

          const updated = await updateScene(activeScene.id, input);
          if (!updated) {
            throw new Error("تعذر حفظ بيانات المشهد.");
          }

          const nextForm = sceneToForm(updated);
          setForm(nextForm);
          setSavedForm(nextForm);
        }

        const dirtyElements = Object.values(elementsByScene)
          .reduce<SceneElement[]>(
            (allElements, sceneElements) => [
              ...allElements,
              ...sceneElements,
            ],
            [],
          )
          .filter((element) =>
            dirtyElementIds.has(element.id),
          );

        for (const element of dirtyElements) {
          await sceneElementService.updateElement(element.id, {
            type: element.type,
            content: element.content,
            characterId: element.characterId,
            isDualDialogue: element.isDualDialogue,
            isLocked: element.isLocked,
          });
        }
      });

      setDirtyElementIds(new Set());
      setSaveState("saved");
    } catch (caughtError) {
      setSaveState("error");

      console.error(
        "Failed to save screenplay:",
        caughtError,
      );
    } finally {
      saveInFlightRef.current = false;
    }
  }

  function openPdfExportDialog(): void {
    if (visibleScenes.length === 0) {
      setInteractionError("لا توجد مشاهد قابلة للتصدير.");
      return;
    }

    setPdfCoverForm(loadPdfCoverForm(project));
    setInteractionError(null);
    setIsPdfExportDialogOpen(true);
  }

  async function exportCurrentScreenplayPdf(): Promise<void> {
    if (isExportingPdf) {
      return;
    }

    if (visibleScenes.length === 0) {
      setInteractionError("لا توجد مشاهد قابلة للتصدير.");
      return;
    }

    setIsExportingPdf(true);
    setInteractionError(null);

    try {
      await saveAll();

      const activeEpisode = usesEpisodes
        ? episodes.find((episode) => episode.id === activeEpisodeId) ?? null
        : null;

      savePdfCoverForm(project.id, pdfCoverForm);

      await exportScreenplayToPdf({
        project,
        episode: activeEpisode,
        scenes: visibleScenes,
        elementsByScene,
        cover: pdfCoverForm,
      });

      setIsPdfExportDialogOpen(false);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : String(caughtError);

      setInteractionError(
        `تعذر تجهيز نسخة PDF: ${message}`,
      );

      console.error(
        "Failed to export screenplay PDF:",
        caughtError,
      );
    } finally {
      setIsExportingPdf(false);
    }
  }

  function openEpisodeCreator(): void {
    const nextNumber =
      episodes.reduce(
        (maximum, episode) =>
          Math.max(maximum, episode.number),
        0,
      ) + 1;

    setNewEpisodeNumber(String(nextNumber));
    setNewEpisodeTitle("");
    setInteractionError(null);
    setIsEpisodeCreatorOpen(true);
  }

  async function createEpisodeFromEditor(): Promise<void> {
    if (isCreatingEpisode) {
      return;
    }

    const number = Number(newEpisodeNumber);

    if (!Number.isInteger(number) || number < 1) {
      setInteractionError(
        "رقم الحلقة يجب أن يكون عددًا صحيحًا أكبر من صفر.",
      );
      return;
    }

    setIsCreatingEpisode(true);
    setInteractionError(null);

    try {
      await saveAll();

      const createdEpisode =
        await createQuickEpisode({
          seasonId: null,
          number,
          title: newEpisodeTitle.trim() || null,
          synopsis: null,
          notes: null,
          targetDurationMinutes: 52,
          status: "outline",
        });

      if (!createdEpisode) {
        return;
      }

      setActiveEpisodeId(createdEpisode.id);
      setActiveSceneId(null);
      setActiveElementId(null);
      setIsInspectorOpen(false);
      setIsEpisodeCreatorOpen(false);
      setNewEpisodeNumber("");
      setNewEpisodeTitle("");
    } finally {
      setIsCreatingEpisode(false);
    }
  }

  function openCharacterPanel(): void {
    setCharacterSearch("");
    setInteractionError(null);
    setIsCharacterPanelOpen(true);
  }

  function openCharacterCreator(): void {
    setNewCharacterName("");
    setNewCharacterShortName("");
    setNewCharacterNotes("");
    setInteractionError(null);
    setIsCharacterCreatorOpen(true);
  }

  async function createCharacterFromEditor(): Promise<void> {
    if (isCreatingCharacter) {
      return;
    }

    const name = newCharacterName.trim();
    const shortName = newCharacterShortName.trim();

    if (!name) {
      setInteractionError("اكتب اسم الشخصية أولًا.");
      return;
    }

    const normalizedName = normalizeImportedEntityName(name);
    const normalizedShortName = normalizeImportedEntityName(shortName);
    const duplicate = characters.find((character) => {
      const candidateNames = [
        normalizeImportedEntityName(character.name),
        normalizeImportedEntityName(character.shortName ?? ""),
      ].filter(Boolean);

      return (
        candidateNames.includes(normalizedName) ||
        Boolean(normalizedShortName) &&
          candidateNames.includes(normalizedShortName)
      );
    });

    if (duplicate) {
      setInteractionError(
        `توجد شخصية مسجلة مسبقًا باسم «${duplicate.name}».`,
      );
      return;
    }

    setIsCreatingCharacter(true);
    setInteractionError(null);

    try {
      const createdCharacter = await createQuickCharacter({
        name,
        shortName: shortName || null,
        gender: "unspecified",
        role: "unspecified",
        notes: newCharacterNotes.trim() || null,
      });

      if (!createdCharacter) {
        return;
      }

      setCharacterSearch("");
      setIsCharacterCreatorOpen(false);
      setNewCharacterName("");
      setNewCharacterShortName("");
      setNewCharacterNotes("");
    } finally {
      setIsCreatingCharacter(false);
    }
  }

  function analyzeImportedText(): void {
    const parsed =
      parseScreenplayText(
        importSource,
      );

    setImportPreview(
      parsed,
    );

    if (
      parsed.scenes.length === 0
    ) {
      setInteractionError(
        "لم يُعثر على أي مشهد. يجب أن يحتوي النص على سطر مثل: المشهد 1.",
      );
    } else {
      setInteractionError(null);
    }
  }

  async function importParsedScreenplay(): Promise<void> {
    const parsed =
      importPreview;

    if (
      !parsed ||
      parsed.scenes.length === 0 ||
      isImporting
    ) {
      return;
    }

    let episodeId =
      usesEpisodes
        ? activeEpisodeId ||
          episodes[0]?.id ||
          null
        : null;

    if (usesEpisodes && !episodeId) {
      try {
        const refreshedEpisodes =
          await reloadEpisodes();

        episodeId =
          refreshedEpisodes[0]?.id ??
          null;

        if (episodeId) {
          setActiveEpisodeId(episodeId);
        }
      } catch (caughtError) {
        setInteractionError(
          caughtError instanceof Error
            ? caughtError.message
            : String(caughtError),
        );
        return;
      }
    }

    if (
      usesEpisodes &&
      !episodeId
    ) {
      setInteractionError(
        "حدد الحلقة التي سيُستورد إليها النص.",
      );
      return;
    }

    setIsImporting(true);
    setInteractionError(null);

    try {
      await saveAll();

      await enqueueDatabaseWrite(async () => {
        const characterByName =
          new Map<string, Character>();

        for (const character of characters) {
          characterByName.set(
            normalizeImportedEntityName(
              character.name,
            ),
            character,
          );

          if (character.shortName) {
            characterByName.set(
              normalizeImportedEntityName(
                character.shortName,
              ),
              character,
            );
          }
        }

        const importedCharacterNames =
          collectImportedCharacterNames(
            parsed,
          );

        for (
          const characterName of
          importedCharacterNames
        ) {
          const comparableName =
            normalizeImportedEntityName(
              characterName,
            );

          if (
            characterByName.has(
              comparableName,
            )
          ) {
            continue;
          }

          const createdCharacter =
            await createQuickCharacter({
              name: characterName,
              shortName: null,
              gender: "unspecified",
              role: "unspecified",
              notes:
                "أُنشئت تلقائيًا أثناء استيراد نص السيناريو.",
            });

          if (!createdCharacter) {
            throw new Error(
              `تعذر حفظ الشخصية «${characterName}».`,
            );
          }

          characterByName.set(
            comparableName,
            createdCharacter,
          );
        }

        const locationByName =
          new Map<string, Location>();

        for (const location of locations) {
          locationByName.set(
            normalizeImportedEntityName(
              location.name,
            ),
            location,
          );
        }

        for (const parsedScene of parsed.scenes) {
          const locationName =
            parsedScene.locationText.trim();

          if (!locationName) {
            continue;
          }

          const comparableName =
            normalizeImportedEntityName(
              locationName,
            );

          if (
            locationByName.has(
              comparableName,
            )
          ) {
            continue;
          }

          const createdLocation =
            await createQuickLocation({
              parentLocationId: null,
              name: locationName,
              type:
                inferImportedLocationType(
                  locationName,
                ),
              description: null,
              notes:
                "أُنشئ تلقائيًا أثناء استيراد نص السيناريو.",
            });

          if (!createdLocation) {
            throw new Error(
              `تعذر حفظ المكان «${locationName}».`,
            );
          }

          locationByName.set(
            comparableName,
            createdLocation,
          );
        }

        const reservedNumbers =
          new Set(
            scenes
              .filter(
                (scene) =>
                  scene.episodeId ===
                  episodeId,
              )
              .map(
                (scene) =>
                  scene.sceneNumber,
              ),
          );

        let nextNumber =
          Number(
            getNextSceneNumber(
              scenes,
              episodeId,
            ),
          );

        let firstImportedSceneId:
          string | null = null;

        let firstImportedElementId:
          string | null = null;

        for (
          const parsedScene of
          parsed.scenes
        ) {
          let sceneNumber =
            parsedScene.sourceSceneNumber;

          if (
            !sceneNumber ||
            reservedNumbers.has(
              sceneNumber,
            )
          ) {
            while (
              reservedNumbers.has(
                String(nextNumber),
              )
            ) {
              nextNumber += 1;
            }

            sceneNumber =
              String(nextNumber);

            nextNumber += 1;
          }

          reservedNumbers.add(
            sceneNumber,
          );

          const importedLocation =
            parsedScene.locationText.trim()
              ? locationByName.get(
                  normalizeImportedEntityName(
                    parsedScene.locationText,
                  ),
                ) ?? null
              : null;

          const createdScene =
            await createScene({
              episodeId,
              locationId:
                importedLocation?.id ??
                null,
              sceneNumber,
              title: null,
              heading:
                parsedScene.heading,
              interiorExterior:
                parsedScene
                  .interiorExterior,
              timeOfDay:
                parsedScene.timeOfDay,
              customTimeOfDay:
                parsedScene
                  .customTimeOfDay,
              synopsis: null,
              dramaticPurpose: null,
              notes: null,
              estimatedDurationSeconds:
                null,
              status: "draft",
            });

          if (!createdScene) {
            throw new Error(
              `تعذر إنشاء المشهد ${sceneNumber}.`,
            );
          }

          const importedElements:
            SceneElement[] = [];

          let previousElementId:
            string | null = null;

          for (
            const parsedElement of
            parsedScene.elements
          ) {
            const matchingCharacter =
              parsedElement.type ===
                "character"
                ? characterByName.get(
                    normalizeImportedEntityName(
                      parsedElement.content,
                    ),
                  ) ?? null
                : null;

            const createdElement =
              await sceneElementService
                .createElement({
                  sceneId:
                    createdScene.id,
                  type:
                    parsedElement.type,
                  content:
                    parsedElement.content,
                  characterId:
                    matchingCharacter?.id ??
                    null,
                  insertAfterElementId:
                    previousElementId,
                });

            importedElements.push(
              createdElement,
            );

            previousElementId =
              createdElement.id;
          }

          if (
            importedElements.length === 0
          ) {
            const emptyElement =
              await sceneElementService
                .createElement({
                  sceneId:
                    createdScene.id,
                  type: "action",
                  content: "",
                  characterId: null,
                });

            importedElements.push(
              emptyElement,
            );
          }

          setElementsByScene(
            (current) => ({
              ...current,
              [createdScene.id]:
                importedElements,
            }),
          );

          firstImportedSceneId ??=
            createdScene.id;

          firstImportedElementId ??=
            importedElements[0]?.id ??
            null;
        }

        setIsImportOpen(false);
        setImportSource("");
        setImportPreview(null);

        if (firstImportedSceneId) {
          setActiveSceneId(
            firstImportedSceneId,
          );

          setActiveElementId(
            firstImportedElementId,
          );

          window.setTimeout(() => {
            sceneRefs.current
              .get(
                firstImportedSceneId,
              )
              ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
          }, 100);
        }
      });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : String(caughtError);

      setInteractionError(
        message,
      );

      console.error(
        "Failed to import screenplay text:",
        caughtError,
      );
    } finally {
      setIsImporting(false);
    }
  }

  async function createNewScene(): Promise<void> {
    if (sceneCreationInFlightRef.current) {
      return;
    }

    sceneCreationInFlightRef.current = true;
    setInteractionError(null);

    try {
      await enqueueDatabaseWrite(async () => {
        const episodeId =
          usesEpisodes
            ? activeEpisodeId || null
            : null;

        const created = await createScene({
          episodeId,
          locationId: null,
          sceneNumber: getNextSceneNumber(
            scenes,
            episodeId,
          ),
          title: null,
          heading: "",
          interiorExterior: "unspecified",
          timeOfDay: "unspecified",
          customTimeOfDay: null,
          synopsis: null,
          dramaticPurpose: null,
          notes: null,
          estimatedDurationSeconds: null,
          status: "draft",
        });

        if (!created) {
          throw new Error(
            "تعذر إنشاء المشهد. أعد المحاولة بعد اكتمال العملية الجارية.",
          );
        }

        const firstElement =
          await sceneElementService.createElement({
            sceneId: created.id,
            type: "action",
            content: "",
            characterId: null,
          });

        setElementsByScene(
          (current) => ({
            ...current,
            [created.id]: [
              firstElement,
            ],
          }),
        );

        setActiveSceneId(
          created.id,
        );

        setActiveElementId(
          firstElement.id,
        );

        setIsInspectorOpen(true);

        window.setTimeout(() => {
          sceneRefs.current
            .get(created.id)
            ?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });

          headingRefs.current
            .get(created.id)
            ?.focus();
        }, 60);
      });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : String(caughtError);

      setInteractionError(message);

      console.error(
        "Failed to create scene:",
        caughtError,
      );
    } finally {
      sceneCreationInFlightRef.current = false;
    }
  }

  async function createNewSceneFromEditor(): Promise<void> {
    await saveAll();
    await createNewScene();
  }

  async function addElementAfter(
    sceneId: string,
    afterElementId: string | null,
    type: SceneElementType,
  ): Promise<void> {
    if (elementInsertionInFlightRef.current) {
      return;
    }

    elementInsertionInFlightRef.current = true;

    try {
      await enqueueDatabaseWrite(async () => {
        const initialContent =
          type === "parenthetical" ? "()" : "";

        const created = await sceneElementService.createElement({
          sceneId,
          type,
          content: initialContent,
          characterId: null,
          insertAfterElementId: afterElementId,
        });

        const loaded = await sceneElementService.listElements(sceneId);

        setElementsByScene((current) => ({
          ...current,
          [sceneId]: [...loaded].sort(
            (a, b) => a.orderIndex - b.orderIndex,
          ),
        }));

        setActiveSceneId(sceneId);
        setActiveElementId(created.id);

        focusElementTextarea(
          created.id,
          type === "parenthetical" ? 1 : 0,
        );
      });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : String(caughtError);

      setInteractionError(message);

      console.error(
        "Failed to insert screenplay element:",
        caughtError,
      );
    } finally {
      elementInsertionInFlightRef.current = false;
    }
  }

  function updateLocalElement(sceneId: string, elementId: string, changes: Partial<SceneElement>): void {
    setElementsByScene((current) => ({
      ...current,
      [sceneId]: (current[sceneId] ?? []).map((element) =>
        element.id === elementId ? { ...element, ...changes } : element,
      ),
    }));

    setDirtyElementIds((current) => new Set(current).add(elementId));
  }

  async function applyType(type: SceneElementType): Promise<void> {
    if (!activeSceneId) {
      return;
    }

    if (!activeElement) {
      const last = activeElements.length > 0 ? activeElements[activeElements.length - 1] : null;
      await addElementAfter(activeSceneId, last?.id ?? null, type);
      return;
    }

    updateLocalElement(activeSceneId, activeElement.id, {
      type,
      content: type === "parenthetical" && !activeElement.content.trim() ? "()" : activeElement.content,
      characterId: type === "character" || type === "dialogue" ? activeElement.characterId : null,
    });
  }

  async function handleElementKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
    sceneId: string,
    element: SceneElement,
    characterSuggestion: Character | null = null,
  ): Promise<void> {
    if (event.nativeEvent.isComposing) {
      return;
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === "Enter"
    ) {
      event.preventDefault();
      await createNewSceneFromEditor();
      return;
    }

    const directType =
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      !event.shiftKey
        ? directTypeShortcuts[event.key]
        : undefined;

    if (directType) {
      event.preventDefault();

      if (
        directType === "transition" &&
        element.content.trim()
      ) {
        await addElementAfter(
          sceneId,
          element.id,
          "transition",
        );

        return;
      }

      updateLocalElement(sceneId, element.id, {
        type: directType,
        content:
          directType === "parenthetical" &&
          !element.content.trim()
            ? "()"
            : directType === "transition"
              ? ""
              : element.content,
        characterId:
          directType === "character" ||
          directType === "dialogue"
            ? element.characterId
            : null,
      });

      if (directType === "parenthetical") {
        focusElementTextarea(
          element.id,
          element.content.trim()
            ? -1
            : 1,
        );
      }

      return;
    }

    if (
      element.type === "character" &&
      characterSuggestion &&
      event.key === "Enter"
    ) {
      event.preventDefault();

      updateLocalElement(sceneId, element.id, {
        characterId: characterSuggestion.id,
        content:
          characterSuggestion.shortName ??
          characterSuggestion.name,
      });

      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();

      const nextType = cycleElementType(
        element.type,
        event.shiftKey,
      );

      updateLocalElement(sceneId, element.id, {
        type: nextType,
        content:
          nextType === "parenthetical" &&
          !element.content.trim()
            ? "()"
            : element.content,
        characterId:
          nextType === "character" ||
          nextType === "dialogue"
            ? element.characterId
            : null,
      });

      return;
    }

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      const currentContent =
        event.currentTarget.value;

      if (currentContent !== element.content) {
        updateLocalElement(sceneId, element.id, {
          content: currentContent,
        });
      }

      await addElementAfter(
        sceneId,
        element.id,
        getNextElementType(
          element.type,
          currentContent,
        ),
      );

      return;
    }

    if (
      event.key === "Backspace" &&
      event.currentTarget.value.length === 0 &&
      event.currentTarget.selectionStart === 0 &&
      event.currentTarget.selectionEnd === 0
    ) {
      event.preventDefault();

      await deleteElementFromKeyboard(
        sceneId,
        element,
      );

      return;
    }

    if (event.key === "ArrowUp") {
      const textarea =
        event.currentTarget;

      if (
        textarea.selectionStart === 0 &&
        textarea.selectionEnd === 0
      ) {
        const previousElement =
          getAdjacentElement(
            sceneId,
            element.id,
            -1,
          );

        if (previousElement) {
          event.preventDefault();
          setActiveElementId(previousElement.id);
          focusElementTextarea(
            previousElement.id,
            -1,
          );
        }
      }

      return;
    }

    if (event.key === "ArrowDown") {
      const textarea =
        event.currentTarget;

      if (
        textarea.selectionStart ===
          textarea.value.length &&
        textarea.selectionEnd ===
          textarea.value.length
      ) {
        const nextElement =
          getAdjacentElement(
            sceneId,
            element.id,
            1,
          );

        if (nextElement) {
          event.preventDefault();
          setActiveElementId(nextElement.id);
          focusElementTextarea(
            nextElement.id,
            0,
          );
        }
      }
    }
  }

  function getAdjacentElement(
    sceneId: string,
    elementId: string,
    direction: -1 | 1,
  ): SceneElement | null {
    const sceneElements = elementsByScene[sceneId] ?? [];
    const currentIndex = sceneElements.findIndex(
      (candidate) => candidate.id === elementId,
    );

    return sceneElements[currentIndex + direction] ?? null;
  }

  async function deleteElementFromKeyboard(
    sceneId: string,
    element: SceneElement,
  ): Promise<void> {
    const sceneElements = elementsByScene[sceneId] ?? [];

    if (sceneElements.length <= 1) {
      updateLocalElement(sceneId, element.id, {
        type: "action",
        content: "",
        characterId: null,
      });

      setActiveElementId(element.id);
      focusElementTextarea(element.id, 0);
      return;
    }

    await deleteElement(sceneId, element);
  }

  async function deleteElement(sceneId: string, element: SceneElement): Promise<void> {
    await enqueueDatabaseWrite(async () => {
      const sceneElements = elementsByScene[sceneId] ?? [];
      const elementIndex = sceneElements.findIndex((candidate) => candidate.id === element.id);
      const fallbackElement =
        sceneElements[elementIndex - 1] ??
        sceneElements[elementIndex + 1] ??
        null;

      await sceneElementService.deleteElement(element.id);
      const loaded = await sceneElementService.listElements(sceneId);

      setElementsByScene((current) => ({
        ...current,
        [sceneId]: [...loaded].sort((a, b) => a.orderIndex - b.orderIndex),
      }));

      setDirtyElementIds((current) => {
        const next = new Set(current);
        next.delete(element.id);
        return next;
      });

      setActiveElementId(fallbackElement?.id ?? null);

      if (fallbackElement) {
        focusElementTextarea(fallbackElement.id, -1);
      }
    });
  }

  async function acceptSceneHeading(): Promise<void> {
    await saveAll();
    setIsInspectorOpen(false);

    if (!activeSceneId) {
      return;
    }

    const firstElement =
      (elementsByScene[activeSceneId] ?? [])[0];

    if (firstElement) {
      setActiveElementId(firstElement.id);
      focusElementTextarea(firstElement.id, 0);
    }
  }

  function clearDeletedSceneTimer(): void {
    if (
      deletedSceneTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        deletedSceneTimerRef.current,
      );

      deletedSceneTimerRef.current =
        null;
    }
  }

  function scheduleDeletedSceneCommit(
    snapshot: DeletedSceneSnapshot,
  ): void {
    clearDeletedSceneTimer();

    deletedSceneTimerRef.current =
      window.setTimeout(() => {
        void commitPendingSceneDeletion(
          snapshot,
        );
      }, 10000);
  }

  async function commitPendingSceneDeletion(
    snapshot: DeletedSceneSnapshot,
  ): Promise<void> {
    if (
      deletedSceneCommitInFlightRef.current
    ) {
      return;
    }

    deletedSceneCommitInFlightRef.current =
      true;
    clearDeletedSceneTimer();

    const committed =
      await commitSceneDeletion(
        snapshot.scene.id,
      );

    if (committed) {
      setDeletedSceneSnapshot(
        (current) =>
          current?.scene.id ===
          snapshot.scene.id
            ? null
            : current,
      );
    } else {
      restoreSceneLocally(
        snapshot.scene,
      );

      setElementsByScene(
        (current) => ({
          ...current,
          [snapshot.scene.id]:
            snapshot.elements,
        }),
      );

      setActiveSceneId(
        snapshot.scene.id,
      );

      setDeletedSceneSnapshot(null);

      setInteractionError(
        "تعذر إتمام حذف المشهد، لذلك أُعيد تلقائيًا.",
      );
    }

    deletedSceneCommitInFlightRef.current =
      false;
  }

  async function handleDeleteScene(): Promise<void> {
    if (!activeScene) {
      return;
    }

    if (
      !window.confirm(
        `هل تريد حذف المشهد «${activeScene.sceneNumber}» ونصه؟ يمكنك التراجع خلال عشر ثوانٍ.`,
      )
    ) {
      return;
    }

    await saveAll();

    const snapshot: DeletedSceneSnapshot = {
      scene: activeScene,
      elements:
        [...(
          elementsByScene[
            activeScene.id
          ] ?? []
        )].sort(
          (first, second) =>
            first.orderIndex -
            second.orderIndex,
        ),
      originalIndex:
        Math.max(
          0,
          visibleScenes.findIndex(
            (scene) =>
              scene.id ===
              activeScene.id,
          ),
        ),
    };

    hideSceneLocally(
      activeScene.id,
    );

    setElementsByScene(
      (current) => {
        const next = {
          ...current,
        };

        delete next[
          activeScene.id
        ];

        return next;
      },
    );

    setDeletedSceneSnapshot(
      snapshot,
    );

    scheduleDeletedSceneCommit(
      snapshot,
    );

    setActiveElementId(null);
    setIsInspectorOpen(false);
  }

  function undoDeleteScene(): void {
    const snapshot =
      deletedSceneSnapshot;

    if (
      !snapshot ||
      deletedSceneCommitInFlightRef.current
    ) {
      return;
    }

    clearDeletedSceneTimer();

    restoreSceneLocally(
      snapshot.scene,
    );

    setElementsByScene(
      (current) => ({
        ...current,
        [snapshot.scene.id]:
          snapshot.elements,
      }),
    );

    setActiveSceneId(
      snapshot.scene.id,
    );

    setActiveElementId(
      snapshot.elements[0]?.id ??
        null,
    );

    setDeletedSceneSnapshot(null);
    setInteractionError(null);

    window.setTimeout(() => {
      sceneRefs.current
        .get(snapshot.scene.id)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

      const firstElementId =
        snapshot.elements[0]?.id;

      if (firstElementId) {
        focusElementTextarea(
          firstElementId,
          0,
        );
      }
    }, 80);
  }

  function handleScenePointerDown(
    event: PointerEvent<HTMLButtonElement>,
    sceneId: string,
  ): void {
    if (
      event.button !== 0 ||
      isSaving
    ) {
      return;
    }

    pointerDragRef.current = {
      pointerId: event.pointerId,
      sceneId,
      startX: event.clientX,
      startY: event.clientY,
      didMove: false,
    };

    dragTargetRef.current = null;
    setDragTarget(null);

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );
  }

  function handleScenePointerMove(
    event: PointerEvent<HTMLButtonElement>,
  ): void {
    const drag =
      pointerDragRef.current;

    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return;
    }

    const movedDistance =
      Math.hypot(
        event.clientX - drag.startX,
        event.clientY - drag.startY,
      );

    if (
      !drag.didMove &&
      movedDistance < 5
    ) {
      return;
    }

    drag.didMove = true;

    if (!isPointerDragging) {
      setIsPointerDragging(true);
      setDraggedSceneId(
        drag.sceneId,
      );
    }

    event.preventDefault();

    const element =
      document.elementFromPoint(
        event.clientX,
        event.clientY,
      );

    const target =
      element?.closest<HTMLElement>(
        "[data-scene-nav-id]",
      );

    const targetSceneId =
      target?.dataset.sceneNavId;

    if (
      !target ||
      !targetSceneId ||
      targetSceneId === drag.sceneId
    ) {
      dragTargetRef.current = null;
      setDragTarget(null);
      return;
    }

    const bounds =
      target.getBoundingClientRect();

    const nextTarget = {
      sceneId: targetSceneId,
      placement:
        event.clientY <
        bounds.top + bounds.height / 2
          ? "before" as const
          : "after" as const,
    };

    dragTargetRef.current =
      nextTarget;

    setDragTarget(
      nextTarget,
    );
  }

  async function finishScenePointerDrag(
    event: PointerEvent<HTMLButtonElement>,
  ): Promise<void> {
    const drag =
      pointerDragRef.current;

    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return;
    }

    pointerDragRef.current = null;

    if (
      event.currentTarget
        .hasPointerCapture(
          event.pointerId,
        )
    ) {
      event.currentTarget
        .releasePointerCapture(
          event.pointerId,
        );
    }

    const target =
      dragTargetRef.current;

    dragTargetRef.current = null;
    setDraggedSceneId(null);
    setDragTarget(null);
    setIsPointerDragging(false);

    if (
      !drag.didMove ||
      !target ||
      drag.sceneId === target.sceneId
    ) {
      return;
    }

    const currentIds =
      visibleScenes.map(
        (scene) => scene.id,
      );

    const nextIds =
      currentIds.filter(
        (id) => id !== drag.sceneId,
      );

    let insertionIndex =
      nextIds.indexOf(
        target.sceneId,
      );

    if (insertionIndex < 0) {
      return;
    }

    if (
      target.placement === "after"
    ) {
      insertionIndex += 1;
    }

    nextIds.splice(
      insertionIndex,
      0,
      drag.sceneId,
    );

    if (
      nextIds.every(
        (id, index) =>
          id === currentIds[index],
      )
    ) {
      return;
    }

    const reordered =
      await reorderScenes(
        nextIds,
      );

    if (!reordered) {
      setInteractionError(
        "تعذر حفظ ترتيب المشاهد. أُعيد الترتيب السابق.",
      );
    }
  }

  function cancelScenePointerDrag(
    event: PointerEvent<HTMLButtonElement>,
  ): void {
    const drag =
      pointerDragRef.current;

    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return;
    }

    pointerDragRef.current = null;
    dragTargetRef.current = null;
    setDraggedSceneId(null);
    setDragTarget(null);
    setIsPointerDragging(false);
  }

  function goToScene(sceneId: string): void {
    setActiveSceneId(sceneId);
    sceneRefs.current.get(sceneId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function focusElementTextarea(
    elementId: string,
    caretPosition: number,
    attemptsRemaining = 8,
  ): void {
    window.requestAnimationFrame(() => {
      const textarea =
        textareaRefs.current.get(
          elementId,
        );

      if (textarea) {
        textarea.focus();

        const position =
          caretPosition < 0
            ? textarea.value.length
            : Math.min(
                caretPosition,
                textarea.value.length,
              );

        textarea.setSelectionRange(
          position,
          position,
        );

        autoResizeTextarea(
          textarea,
        );

        return;
      }

      if (attemptsRemaining > 0) {
        focusElementTextarea(
          elementId,
          caretPosition,
          attemptsRemaining - 1,
        );
      }
    });
  }

  return (
    <main className={`screenplay-editor ${isFocusMode ? "is-focus-mode" : ""}`} dir="rtl">
      <header className="screenplay-topbar">
        <div className="screenplay-project">
          <button type="button" className="icon-button" onClick={() => setIsScenesOpen((value) => !value)}>☰</button>
          <div><strong>{project.title}</strong><small>محرر السيناريو</small></div>
        </div>

        <div className="screenplay-topbar-center">
          {usesEpisodes && (
            <>
              <select
                value={activeEpisodeId}
                onChange={(event) =>
                  setActiveEpisodeId(event.target.value)
                }
              >
                {episodes.map((episode) => (
                  <option key={episode.id} value={episode.id}>
                    الحلقة {episode.number}
                    {episode.title ? ` — ${episode.title}` : ""}
                  </option>
                ))}
              </select>

              {project.projectType === "series" && (
                <button
                  type="button"
                  className="text-button"
                  disabled={isSaving || isCreatingEpisode}
                  onClick={openEpisodeCreator}
                >
                  + حلقة جديدة
                </button>
              )}
            </>
          )}
        </div>

        <div className="screenplay-topbar-actions">
          <span className={`autosave-status is-${saveState}`}>{getSaveStateLabel(saveState)}</span>
          <button
            type="button"
            className="text-button"
            disabled={
              isExportingPdf ||
              isLoading ||
              isLoadingDocument ||
              visibleScenes.length === 0
            }
            onClick={openPdfExportDialog}
          >
            {isExportingPdf
              ? "جارٍ تجهيز PDF..."
              : "تصدير PDF"}
          </button>
          <button
            type="button"
            className="text-button"
            onClick={openCharacterPanel}
          >
            الشخصيات
          </button>
          <button
            type="button"
            className="text-button"
            disabled={!activeScene}
            onClick={() => setIsInspectorOpen(true)}
          >
            رأس المشهد
          </button>
          <button type="button" className="text-button" onClick={() => setIsFocusMode((value) => !value)}>
            {isFocusMode ? "إنهاء التركيز" : "وضع التركيز"}
          </button>
        </div>
      </header>

      {(error || interactionError) && (
        <div
          className="screenplay-error"
          role="alert"
        >
          {interactionError ?? error}
        </div>
      )}

      {deletedSceneSnapshot && (
        <div
          className="scene-delete-undo"
          role="status"
          aria-live="polite"
        >
          <span>
            حُذف المشهد{" "}
            <strong>
              {deletedSceneSnapshot.scene.sceneNumber}
            </strong>
          </span>

          <button
            type="button"
            disabled={
              deletedSceneCommitInFlightRef.current
            }
            onClick={() =>
              void undoDeleteScene()
            }
          >
            تراجع
          </button>
        </div>
      )}

      {isPdfExportDialogOpen && (
        <div
          className="pdf-export-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isExportingPdf
            ) {
              setIsPdfExportDialogOpen(false);
            }
          }}
        >
          <section
            className="pdf-export-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="إعداد تصدير PDF"
          >
            <header className="pdf-export-dialog__header">
              <div>
                <small>نسخة التقديم</small>
                <strong>إعداد صفحة الغلاف</strong>
              </div>

              <button
                type="button"
                aria-label="إغلاق"
                disabled={isExportingPdf}
                onClick={() => setIsPdfExportDialogOpen(false)}
              >
                ×
              </button>
            </header>

            <div className="pdf-export-dialog__body">
              <div className="pdf-export-form">
                <label className="pdf-export-toggle">
                  <input
                    type="checkbox"
                    checked={pdfCoverForm.showCover}
                    disabled={isExportingPdf}
                    onChange={(event) =>
                      setPdfCoverForm((current) => ({
                        ...current,
                        showCover: event.target.checked,
                      }))
                    }
                  />
                  <span>إظهار صفحة الغلاف</span>
                </label>

                <label>
                  <span>عنوان العمل</span>
                  <input
                    value={pdfCoverForm.title}
                    disabled={isExportingPdf}
                    onChange={(event) =>
                      setPdfCoverForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span>العنوان الفرعي</span>
                  <input
                    value={pdfCoverForm.subtitle}
                    disabled={isExportingPdf}
                    placeholder="اختياري"
                    onChange={(event) =>
                      setPdfCoverForm((current) => ({
                        ...current,
                        subtitle: event.target.value,
                      }))
                    }
                  />
                </label>

                <div className="pdf-export-form__row">
                  <label>
                    <span>الصفة</span>
                    <input
                      value={pdfCoverForm.creditLabel}
                      disabled={isExportingPdf}
                      placeholder="سيناريو وحوار"
                      onChange={(event) =>
                        setPdfCoverForm((current) => ({
                          ...current,
                          creditLabel: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span>اسم الكاتب</span>
                    <input
                      value={pdfCoverForm.authorName}
                      disabled={isExportingPdf}
                      placeholder="اسم الكاتب"
                      onChange={(event) =>
                        setPdfCoverForm((current) => ({
                          ...current,
                          authorName: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <label>
                  <span>الجهة المقدَّم إليها</span>
                  <input
                    value={pdfCoverForm.presentedTo}
                    disabled={isExportingPdf}
                    placeholder="شركة إنتاج أو لجنة قراءة - اختياري"
                    onChange={(event) =>
                      setPdfCoverForm((current) => ({
                        ...current,
                        presentedTo: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span>معلومات الاتصال</span>
                  <textarea
                    rows={3}
                    value={pdfCoverForm.contact}
                    disabled={isExportingPdf}
                    placeholder="البريد الإلكتروني أو الهاتف - اختياري"
                    onChange={(event) =>
                      setPdfCoverForm((current) => ({
                        ...current,
                        contact: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="pdf-cover-preview" aria-label="معاينة الغلاف">
                {pdfCoverForm.showCover ? (
                  <div className="pdf-cover-preview__page">
                    <small>سيناريو</small>
                    <h3>{pdfCoverForm.title.trim() || project.title}</h3>
                    {pdfCoverForm.subtitle.trim() && (
                      <p>{pdfCoverForm.subtitle}</p>
                    )}
                    {usesEpisodes && activeEpisodeId && (
                      <strong>
                        {getEpisodeExportLabel(episodes, activeEpisodeId)}
                      </strong>
                    )}
                    <span>{getProjectTypeDisplayLabel(project.projectType)}</span>
                    {pdfCoverForm.authorName.trim() && (
                      <div className="pdf-cover-preview__author">
                        <small>{pdfCoverForm.creditLabel || "سيناريو وحوار"}</small>
                        <b>{pdfCoverForm.authorName}</b>
                      </div>
                    )}
                    {(pdfCoverForm.presentedTo.trim() ||
                      pdfCoverForm.contact.trim()) && (
                      <div className="pdf-cover-preview__footer">
                        {pdfCoverForm.presentedTo.trim() && (
                          <div>مقدَّم إلى: {pdfCoverForm.presentedTo}</div>
                        )}
                        {pdfCoverForm.contact.trim() && (
                          <div>{pdfCoverForm.contact}</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pdf-cover-preview__empty">
                    سيبدأ الملف مباشرة من الصفحة الأولى للنص.
                  </div>
                )}
              </div>
            </div>

            <footer className="pdf-export-dialog__actions">
              <button
                type="button"
                className="pdf-export-cancel"
                disabled={isExportingPdf}
                onClick={() => setIsPdfExportDialogOpen(false)}
              >
                إلغاء
              </button>

              <button
                type="button"
                className="pdf-export-confirm"
                disabled={
                  isExportingPdf ||
                  !pdfCoverForm.title.trim()
                }
                onClick={() => void exportCurrentScreenplayPdf()}
              >
                {isExportingPdf
                  ? "جارٍ تجهيز PDF..."
                  : "متابعة إلى التصدير"}
              </button>
            </footer>
          </section>
        </div>
      )}

      {isCharacterPanelOpen && (
        <div
          className="character-panel-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isCreatingCharacter
            ) {
              setIsCharacterPanelOpen(false);
              setIsCharacterCreatorOpen(false);
            }
          }}
        >
          <aside
            className="character-panel"
            role="dialog"
            aria-modal="true"
            aria-label="شخصيات المشروع"
          >
            <header className="character-panel__header">
              <div>
                <small>داخل محرر السيناريو</small>
                <strong>الشخصيات</strong>
              </div>

              <button
                type="button"
                aria-label="إغلاق"
                disabled={isCreatingCharacter}
                onClick={() => {
                  setIsCharacterPanelOpen(false);
                  setIsCharacterCreatorOpen(false);
                }}
              >
                ×
              </button>
            </header>

            <div className="character-panel__tools">
              <input
                type="search"
                value={characterSearch}
                placeholder="ابحث بالاسم أو الاسم المختصر..."
                onChange={(event) =>
                  setCharacterSearch(event.target.value)
                }
              />

              <button
                type="button"
                onClick={openCharacterCreator}
              >
                + شخصية جديدة
              </button>
            </div>

            {isCharacterCreatorOpen && (
              <section className="character-quick-create">
                <div className="character-quick-create__heading">
                  <strong>إنشاء شخصية سريعة</strong>
                  <button
                    type="button"
                    disabled={isCreatingCharacter}
                    onClick={() => setIsCharacterCreatorOpen(false)}
                  >
                    إلغاء
                  </button>
                </div>

                <label>
                  <span>اسم الشخصية</span>
                  <input
                    autoFocus
                    value={newCharacterName}
                    disabled={isCreatingCharacter}
                    placeholder="مثال: سلمى"
                    onChange={(event) =>
                      setNewCharacterName(event.target.value)
                    }
                  />
                </label>

                <label>
                  <span>الاسم المختصر</span>
                  <input
                    value={newCharacterShortName}
                    disabled={isCreatingCharacter}
                    placeholder="اختياري"
                    onChange={(event) =>
                      setNewCharacterShortName(event.target.value)
                    }
                  />
                </label>

                <label>
                  <span>ملاحظات</span>
                  <textarea
                    value={newCharacterNotes}
                    disabled={isCreatingCharacter}
                    placeholder="معلومة مختصرة عن الشخصية..."
                    onChange={(event) =>
                      setNewCharacterNotes(event.target.value)
                    }
                  />
                </label>

                <button
                  type="button"
                  className="character-quick-create__submit"
                  disabled={
                    isCreatingCharacter ||
                    !newCharacterName.trim()
                  }
                  onClick={() =>
                    void createCharacterFromEditor()
                  }
                >
                  {isCreatingCharacter
                    ? "جارٍ إنشاء الشخصية..."
                    : "إنشاء الشخصية"}
                </button>
              </section>
            )}

            <div className="character-panel__summary">
              <span>{filteredCharacters.length} شخصية</span>
              <small>تظهر شخصيات الحلقة الحالية أولًا</small>
            </div>

            <div className="character-panel__list">
              {filteredCharacters.length === 0 ? (
                <div className="character-panel__empty">
                  لا توجد شخصية مطابقة للبحث.
                </div>
              ) : (
                filteredCharacters.map((character) => {
                  const sceneCount =
                    characterUsageById.get(character.id)?.size ?? 0;

                  return (
                    <article
                      key={character.id}
                      className={
                        sceneCount > 0
                          ? "character-card is-current"
                          : "character-card"
                      }
                    >
                      <div className="character-card__avatar">
                        {character.name.trim().slice(0, 1)}
                      </div>

                      <div className="character-card__content">
                        <strong>{character.name}</strong>
                        {character.shortName && (
                          <small>{character.shortName}</small>
                        )}
                        <span>
                          {sceneCount > 0
                            ? `تظهر في ${sceneCount} ${
                                sceneCount === 1 ? "مشهد" : "مشاهد"
                              } من الحلقة الحالية`
                            : "غير مستخدمة في الحلقة الحالية"}
                        </span>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      )}

      {isEpisodeCreatorOpen && (
        <div
          className="scene-import-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isCreatingEpisode
            ) {
              setIsEpisodeCreatorOpen(false);
            }
          }}
        >
          <section
            className="scene-import-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="إنشاء حلقة جديدة"
          >
            <header className="scene-import-dialog__header">
              <div>
                <small>المسلسل</small>
                <strong>إنشاء حلقة جديدة</strong>
              </div>

              <button
                type="button"
                disabled={isCreatingEpisode}
                aria-label="إغلاق"
                onClick={() =>
                  setIsEpisodeCreatorOpen(false)
                }
              >
                ×
              </button>
            </header>

            <div className="scene-import-dialog__body">
              <label className="scene-import-source">
                <span>رقم الحلقة</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={newEpisodeNumber}
                  disabled={isCreatingEpisode}
                  onChange={(event) =>
                    setNewEpisodeNumber(event.target.value)
                  }
                />
              </label>

              <label className="scene-import-source">
                <span>عنوان الحلقة</span>
                <input
                  type="text"
                  value={newEpisodeTitle}
                  disabled={isCreatingEpisode}
                  placeholder="عنوان اختياري"
                  onChange={(event) =>
                    setNewEpisodeTitle(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void createEpisodeFromEditor();
                    }
                  }}
                />
              </label>
            </div>

            <footer className="scene-import-dialog__actions">
              <button
                type="button"
                className="scene-import-analyze"
                disabled={isCreatingEpisode}
                onClick={() =>
                  setIsEpisodeCreatorOpen(false)
                }
              >
                إلغاء
              </button>

              <button
                type="button"
                className="scene-import-confirm"
                disabled={
                  isCreatingEpisode ||
                  !newEpisodeNumber.trim()
                }
                onClick={() =>
                  void createEpisodeFromEditor()
                }
              >
                {isCreatingEpisode
                  ? "جارٍ إنشاء الحلقة..."
                  : "إنشاء وفتح الحلقة"}
              </button>
            </footer>
          </section>
        </div>
      )}

      {isImportOpen && (
        <div
          className="scene-import-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget &&
              !isImporting
            ) {
              setIsImportOpen(false);
            }
          }}
        >
          <section
            className="scene-import-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="استيراد نص سيناريو"
          >
            <header className="scene-import-dialog__header">
              <div>
                <small>
                  استيراد وتنسيق
                </small>
                <strong>
                  نص سيناريو عربي
                </strong>
              </div>

              <button
                type="button"
                disabled={isImporting}
                aria-label="إغلاق"
                onClick={() =>
                  setIsImportOpen(false)
                }
              >
                ×
              </button>
            </header>

            <div className="scene-import-dialog__body">
              <label className="scene-import-source">
                <span>
                  الصق النص هنا
                </span>

                <textarea
                  value={importSource}
                  disabled={isImporting}
                  placeholder={"المشهد 1\nخارجي – شارع عام – نهار\n..."}
                  onChange={(event) => {
                    setImportSource(
                      event.target.value,
                    );
                    setImportPreview(
                      null,
                    );
                  }}
                />
              </label>

              <div className="scene-import-preview">
                <div className="scene-import-preview__heading">
                  <strong>
                    المعاينة
                  </strong>

                  {importPreview && (
                    <span>
                      {
                        importPreview
                          .scenes.length
                      }{" "}
                      مشاهد
                    </span>
                  )}
                </div>

                {!importPreview ? (
                  <p>
                    اضغط «تحليل النص» لمعاينة تصنيف الأسطر قبل الاستيراد.
                  </p>
                ) : (
                  <div className="scene-import-preview__list">
                    {importPreview.scenes.map(
                      (
                        scene,
                        sceneIndex,
                      ) => (
                        <article
                          key={`${scene.sourceSceneNumber}-${sceneIndex}`}
                        >
                          <h4>
                            المشهد{" "}
                            {
                              scene.sourceSceneNumber
                            }
                          </h4>

                          <div className="scene-import-preview__heading-line">
                            {scene.heading ||
                              "رأس مشهد غير محدد"}
                          </div>

                          {scene.elements.map(
                            (
                              element,
                              elementIndex,
                            ) => (
                              <div
                                key={`${element.type}-${elementIndex}`}
                                className={`scene-import-preview__element is-${element.type}`}
                              >
                                <small>
                                  {
                                    getImportedElementLabel(
                                      element.type,
                                    )
                                  }
                                </small>
                                <span>
                                  {
                                    element.content
                                  }
                                </span>
                              </div>
                            ),
                          )}
                        </article>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>

            <footer className="scene-import-dialog__actions">
              <button
                type="button"
                className="scene-import-analyze"
                disabled={
                  isImporting ||
                  !importSource.trim()
                }
                onClick={
                  analyzeImportedText
                }
              >
                تحليل النص
              </button>

              <button
                type="button"
                className="scene-import-confirm"
                disabled={
                  isImporting ||
                  !importPreview ||
                  importPreview.scenes
                    .length === 0
                }
                onClick={() =>
                  void importParsedScreenplay()
                }
              >
                {isImporting
                  ? "جارٍ الاستيراد..."
                  : "استيراد إلى المحرر"}
              </button>
            </footer>
          </section>
        </div>
      )}

      <div className={`screenplay-shell ${isScenesOpen ? "" : "is-scenes-closed"}`}>
        {isScenesOpen && (
          <aside className="scene-navigator">
            <div className="scene-navigator-heading"><strong>المشاهد</strong><button type="button" onClick={() => void createNewScene()}>+</button></div>
            <div className="scene-navigator-list">
              {visibleScenes.map((scene) => (
                <div
                  key={scene.id}
                  data-scene-nav-id={scene.id}
                  className={`scene-nav-item-wrap ${
                    scene.id === draggedSceneId
                      ? "is-dragging"
                      : ""
                  } ${
                    dragTarget?.sceneId === scene.id
                      ? `is-drop-${dragTarget.placement}`
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    className={`scene-nav-item ${
                      scene.id === activeSceneId
                        ? "is-active"
                        : ""
                    }`}
                    onClick={() => {
                      if (!isPointerDragging) {
                        goToScene(scene.id);
                      }
                    }}
                    onPointerDown={(event) =>
                      handleScenePointerDown(
                        event,
                        scene.id,
                      )
                    }
                    onPointerMove={
                      handleScenePointerMove
                    }
                    onPointerUp={(event) =>
                      void finishScenePointerDrag(
                        event,
                      )
                    }
                    onPointerCancel={
                      cancelScenePointerDrag
                    }
                  >
                    <span
                      className="scene-nav-drag-handle"
                      aria-hidden="true"
                      title="اسحب لتغيير ترتيب المشهد"
                    >
                      ⋮⋮
                    </span>

                    <span>
                      {scene.sceneNumber}
                    </span>

                    <div>
                      <strong>
                        {scene.heading ||
                          scene.title ||
                          `المشهد ${scene.sceneNumber}`}
                      </strong>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </aside>
        )}

        <section className="screenplay-workspace">
          <div className="format-toolbar">
            <button type="button" className="scene-create-button" onClick={() => void createNewScene()}>مشهد جديد</button>
            <button
              type="button"
              className="scene-import-button"
              onClick={() => {
                setIsImportOpen(true);
                setImportPreview(null);
                setInteractionError(null);
              }}
            >
              استيراد نص
            </button>
            {toolbarTypes.map((item) => (
              <button
                key={item.type}
                type="button"
                className={
                  activeElement?.type === item.type
                    ? "is-active"
                    : ""
                }
                title={getElementShortcutLabel(item.type)}
                onClick={() => void applyType(item.type)}
              >
                <span>{item.label}</span>
                <kbd>
                  {getElementShortcutNumber(item.type)}
                </kbd>
              </button>
            ))}
          </div>

          <div className="screenplay-page-wrap">
            <div className="screenplay-page screenplay-page--continuous">
              {isLoading || isLoadingDocument ? (
                <div className="editor-empty">جارٍ تحميل نص العمل...</div>
              ) : visibleScenes.length === 0 ? (
                <button
                  type="button"
                  className="first-line-button"
                  onClick={() => {
                    void createNewScene();
                  }}
                >
                  أنشئ المشهد الأول وابدأ الكتابة
                </button>
              ) : (
                <div className="screenplay-document">
                  {visibleScenes.map((scene) => {
                    const elements = elementsByScene[scene.id] ?? [];
                    return (
                      <section
                        key={scene.id}
                        className={`document-scene ${scene.id === activeSceneId ? "is-active-scene" : ""}`}
                        ref={(node) => {
                          if (node) sceneRefs.current.set(scene.id, node);
                          else sceneRefs.current.delete(scene.id);
                        }}
                        onMouseDown={() => setActiveSceneId(scene.id)}
                      >
                        <div className="scene-heading-editor-anchor">
                          <button
                            ref={(node) => {
                              if (node) {
                                headingRefs.current.set(scene.id, node);
                              } else {
                                headingRefs.current.delete(scene.id);
                              }
                            }}
                            type="button"
                            className="scene-heading-line"
                            onClick={() => {
                              setActiveSceneId(scene.id);
                              setIsInspectorOpen(true);
                            }}
                          >
                            <span>المشهد {scene.sceneNumber}</span>
                            <strong>
                              {scene.heading || "حدد: داخلي/خارجي — المكان — الزمن"}
                            </strong>
                          </button>

                          {isInspectorOpen && scene.id === activeSceneId && (
                            <div
                              className="scene-heading-popover"
                              role="dialog"
                              aria-label="تحديد رأس المشهد"
                            >
                              <div className="scene-heading-popover__header">
                                <div>
                                  <small>المشهد {scene.sceneNumber}</small>
                                  <strong>رأس المشهد</strong>
                                </div>
                                <button
                                  type="button"
                                  className="scene-heading-popover__close"
                                  onClick={() => setIsInspectorOpen(false)}
                                  aria-label="إغلاق"
                                >
                                  ×
                                </button>
                              </div>

                              <div className="scene-heading-popover__grid">
                                <label>
                                  <span>داخلي / خارجي</span>
                                  <select
                                    value={form.interiorExterior}
                                    onChange={(event) =>
                                      setForm((current) => ({
                                        ...current,
                                        interiorExterior:
                                          event.target.value as InteriorExterior,
                                      }))
                                    }
                                  >
                                    <option value="unspecified">غير محدد</option>
                                    <option value="interior">داخلي</option>
                                    <option value="exterior">خارجي</option>
                                    <option value="interior_exterior">
                                      داخلي / خارجي
                                    </option>
                                  </select>
                                </label>

                                <label>
                                  <span>المكان</span>
                                  <select
                                    value={form.locationId}
                                    onChange={(event) =>
                                      setForm((current) => ({
                                        ...current,
                                        locationId: event.target.value,
                                      }))
                                    }
                                  >
                                    <option value="">غير محدد</option>
                                    {locations.map((location) => (
                                      <option
                                        key={location.id}
                                        value={location.id}
                                      >
                                        {location.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <label>
                                  <span>الزمن</span>
                                  <select
                                    value={form.timeOfDay}
                                    onChange={(event) =>
                                      setForm((current) => ({
                                        ...current,
                                        timeOfDay:
                                          event.target.value as TimeOfDay,
                                      }))
                                    }
                                  >
                                    {timeOfDayOptions.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              </div>

                              {form.timeOfDay === "custom" && (
                                <label className="scene-heading-popover__custom-time">
                                  <span>التحديد الزمني</span>
                                  <input
                                    value={form.customTimeOfDay}
                                    onChange={(event) =>
                                      setForm((current) => ({
                                        ...current,
                                        customTimeOfDay: event.target.value,
                                      }))
                                    }
                                    placeholder="مثال: قبيل الفجر"
                                  />
                                </label>
                              )}

                              <div className="scene-heading-preview">
                                {buildSceneHeading(
                                  form.interiorExterior,
                                  getLocationName(locations, form.locationId),
                                  form.timeOfDay,
                                  form.customTimeOfDay,
                                ) || "سيظهر رأس المشهد هنا"}
                              </div>

                              <div className="scene-heading-popover__actions">
                                <button
                                  type="button"
                                  className="scene-heading-confirm"
                                  onClick={() => void acceptSceneHeading()}
                                >
                                  اعتماد وبدء الكتابة
                                </button>
                                <button
                                  type="button"
                                  className="scene-heading-delete"
                                  onClick={() => void handleDeleteScene()}
                                >
                                  حذف المشهد
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {elements.length === 0 ? (
                          <button type="button" className="empty-scene-line" onClick={() => void addElementAfter(scene.id, null, "action")}>ابدأ كتابة المشهد...</button>
                        ) : elements.map((element) => (
                          <ScreenplayLine
                            key={element.id}
                            element={element}
                            characters={characters}
                            isActive={scene.id === activeSceneId && element.id === activeElementId}
                            registerRef={(node) => {
                              if (node) textareaRefs.current.set(element.id, node);
                              else textareaRefs.current.delete(element.id);
                            }}
                            onFocus={() => { setActiveSceneId(scene.id); setActiveElementId(element.id); }}
                            onChange={(changes) => updateLocalElement(scene.id, element.id, changes)}
                            onKeyDown={(event, characterSuggestion) =>
                              void handleElementKeyDown(
                                event,
                                scene.id,
                                element,
                                characterSuggestion,
                              )
                            }
                            onDelete={() => void deleteElement(scene.id, element)}
                          />
                        ))}
                      </section>
                    );
                  })}

                  <div
                    className="new-scene-keyboard-hint"
                    aria-label="اختصار إنشاء مشهد جديد"
                  >
                    <kbd>Ctrl</kbd>
                    <span>+</span>
                    <kbd>Enter</kbd>
                    <span>إنشاء مشهد جديد</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

    </main>
  );
}

interface ScreenplayLineProps {
  element: SceneElement;
  characters: Character[];
  isActive: boolean;
  registerRef: (node: HTMLTextAreaElement | null) => void;
  onFocus: () => void;
  onChange: (changes: Partial<SceneElement>) => void;
  onKeyDown: (
    event: KeyboardEvent<HTMLTextAreaElement>,
    characterSuggestion?: Character | null,
  ) => void;
  onDelete: () => void;
}

function ScreenplayLine({
  element,
  characters,
  isActive,
  registerRef,
  onFocus,
  onChange,
  onKeyDown,
  onDelete,
}: ScreenplayLineProps) {
  const [isTransitionMenuOpen, setIsTransitionMenuOpen] =
    useState(false);

  const [selectedSuggestionIndex, setSelectedSuggestionIndex] =
    useState(0);

  const confirmedCharacter =
    element.type === "character" &&
    element.characterId
      ? characters.find(
          (character) =>
            character.id ===
            element.characterId,
        ) ?? null
      : null;

  const confirmedCharacterLabel =
    confirmedCharacter
      ? (
          confirmedCharacter.shortName ??
          confirmedCharacter.name
        ).trim()
      : "";

  const hasConfirmedCharacter =
    Boolean(confirmedCharacter) &&
    element.content.trim() ===
      confirmedCharacterLabel;

  const suggestions =
    element.type === "character" &&
    !hasConfirmedCharacter
      ? characters
          .filter((character) => {
            const query =
              element.content
                .trim()
                .toLocaleLowerCase();

            return (
              !query ||
              character.name
                .toLocaleLowerCase()
                .includes(query) ||
              (character.shortName ?? "")
                .toLocaleLowerCase()
                .includes(query)
            );
          })
          .slice(0, 6)
      : [];

  useEffect(() => {
    setIsTransitionMenuOpen(
      isActive &&
      element.type === "transition",
    );
  }, [
    isActive,
    element.type,
  ]);

  useEffect(() => {
    setSelectedSuggestionIndex(0);
  }, [
    element.content,
    element.type,
    suggestions.length,
  ]);

  function selectTransition(
    value: string,
  ): void {
    onChange({
      content: value,
    });

    setIsTransitionMenuOpen(false);
  }

  function handleLocalKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ): void {
    const hasSuggestions =
      isActive &&
      element.type === "character" &&
      suggestions.length > 0;

    if (
      hasSuggestions &&
      event.key === "ArrowDown"
    ) {
      event.preventDefault();

      setSelectedSuggestionIndex(
        (current) =>
          (current + 1) %
          suggestions.length,
      );

      return;
    }

    if (
      hasSuggestions &&
      event.key === "ArrowUp"
    ) {
      event.preventDefault();

      setSelectedSuggestionIndex(
        (current) =>
          (
            current -
            1 +
            suggestions.length
          ) %
          suggestions.length,
      );

      return;
    }

    if (
      hasSuggestions &&
      event.key === "Escape"
    ) {
      event.preventDefault();
      setSelectedSuggestionIndex(-1);
      return;
    }

    const selectedCharacter =
      hasSuggestions &&
      selectedSuggestionIndex >= 0
        ? suggestions[
            selectedSuggestionIndex
          ] ?? null
        : null;

    onKeyDown(
      event,
      selectedCharacter,
    );
  }

  return (
    <div
      className={`screenplay-line is-${element.type} ${
        isActive ? "is-active" : ""
      }`}
    >
      <textarea
        ref={registerRef}
        rows={1}
        value={element.content}
        spellCheck
        placeholder={getElementPlaceholder(element.type)}
        onFocus={() => {
          onFocus();

          if (
            element.type === "transition"
          ) {
            setIsTransitionMenuOpen(true);
          }
        }}
        onInput={(event) =>
          autoResizeTextarea(
            event.currentTarget,
          )
        }
        onChange={(event) =>
          onChange({
            content: event.target.value,
            characterId:
              element.type === "character"
                ? null
                : element.characterId,
          })
        }
        onKeyDown={handleLocalKeyDown}
      />

      {isActive &&
        element.type === "character" &&
        suggestions.length > 0 &&
        selectedSuggestionIndex >= 0 && (
          <div
            className="character-suggestions"
            role="listbox"
            aria-label="اقتراحات الشخصيات"
          >
            {suggestions.map(
              (character, index) => (
                <button
                  key={character.id}
                  type="button"
                  role="option"
                  aria-selected={
                    index ===
                    selectedSuggestionIndex
                  }
                  className={
                    index ===
                    selectedSuggestionIndex
                      ? "is-selected"
                      : ""
                  }
                  onMouseDown={(event) => {
                    event.preventDefault();

                    onChange({
                      characterId:
                        character.id,
                      content:
                        character.shortName ??
                        character.name,
                    });
                  }}
                >
                  <strong>
                    {character.name}
                  </strong>

                  {character.shortName && (
                    <small>
                      {character.shortName}
                    </small>
                  )}
                </button>
              ),
            )}
          </div>
        )}

      {isActive &&
        element.type === "transition" &&
        isTransitionMenuOpen && (
          <div
            className="transition-suggestions"
            role="menu"
            aria-label="اختيار صيغة الانتقال"
          >
            {transitionOptions.map(
              (transition) => (
                <button
                  key={transition}
                  type="button"
                  role="menuitem"
                  onMouseDown={(event) =>
                    event.preventDefault()
                  }
                  onClick={() =>
                    selectTransition(
                      transition,
                    )
                  }
                >
                  {transition}
                </button>
              ),
            )}

            <button
              type="button"
              role="menuitem"
              className="transition-custom-option"
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={() => {
                selectTransition("");
              }}
            >
              انتقال مخصص...
            </button>
          </div>
        )}

      {isActive && (
        <button
          type="button"
          className="line-delete-button"
          aria-label="حذف الفقرة"
          title="حذف الفقرة"
          onPointerDown={(event) =>
            event.preventDefault()
          }
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDelete();
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

function getPdfCoverStorageKey(projectId: string): string {
  return `scene-writer:pdf-cover:${projectId}`;
}

function createDefaultPdfCoverForm(project: Project): PdfCoverFormState {
  return {
    showCover: true,
    title: project.title,
    subtitle: project.subtitle ?? "",
    authorName: project.authorName ?? "",
    creditLabel: "سيناريو وحوار",
    presentedTo: "",
    contact: "",
  };
}

function loadPdfCoverForm(project: Project): PdfCoverFormState {
  const fallback = createDefaultPdfCoverForm(project);

  try {
    const stored = window.localStorage.getItem(
      getPdfCoverStorageKey(project.id),
    );

    if (!stored) {
      return fallback;
    }

    const parsed = JSON.parse(stored) as Partial<PdfCoverFormState>;

    return {
      showCover:
        typeof parsed.showCover === "boolean"
          ? parsed.showCover
          : fallback.showCover,
      title:
        typeof parsed.title === "string"
          ? parsed.title
          : fallback.title,
      subtitle:
        typeof parsed.subtitle === "string"
          ? parsed.subtitle
          : fallback.subtitle,
      authorName:
        typeof parsed.authorName === "string"
          ? parsed.authorName
          : fallback.authorName,
      creditLabel:
        typeof parsed.creditLabel === "string"
          ? parsed.creditLabel
          : fallback.creditLabel,
      presentedTo:
        typeof parsed.presentedTo === "string"
          ? parsed.presentedTo
          : fallback.presentedTo,
      contact:
        typeof parsed.contact === "string"
          ? parsed.contact
          : fallback.contact,
    };
  } catch {
    return fallback;
  }
}

function savePdfCoverForm(
  projectId: string,
  form: PdfCoverFormState,
): void {
  try {
    window.localStorage.setItem(
      getPdfCoverStorageKey(projectId),
      JSON.stringify(form),
    );
  } catch {
    // يستمر التصدير حتى إن تعذر حفظ التفضيلات محليًا.
  }
}

function getEpisodeExportLabel(
  episodes: Array<{ id: string; number: number; title: string | null }>,
  episodeId: string,
): string {
  const episode = episodes.find((candidate) => candidate.id === episodeId);

  if (!episode) {
    return "";
  }

  return `الحلقة ${episode.number}${
    episode.title ? ` - ${episode.title}` : ""
  }`;
}

function getProjectTypeDisplayLabel(
  projectType: Project["projectType"],
): string {
  switch (projectType) {
    case "film":
      return "فيلم";
    case "short_film":
      return "فيلم قصير";
    case "series":
      return "مسلسل";
    case "single_episode":
      return "حلقة منفردة";
    case "stage_play":
      return "مسرحية";
    default:
      return "سيناريو";
  }
}

function collectImportedCharacterNames(
  parsed: ParsedScreenplay,
): string[] {
  const names =
    new Map<string, string>();

  for (const scene of parsed.scenes) {
    for (const element of scene.elements) {
      if (
        element.type !== "character"
      ) {
        continue;
      }

      const name =
        element.content.trim();

      if (!name) {
        continue;
      }

      names.set(
        normalizeImportedEntityName(
          name,
        ),
        name,
      );
    }
  }

  return [...names.values()];
}

function normalizeImportedEntityName(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("ar");
}

function inferImportedLocationType(
  locationName: string,
): Location["type"] {
  const name =
    normalizeImportedEntityName(
      locationName,
    );

  if (
    /(?:شارع|زنقة|طريق|رصيف|زقاق)/.test(
      name,
    )
  ) {
    return "street";
  }

  if (
    /(?:بيت|منزل|دار|فيلا|شقة)/.test(
      name,
    )
  ) {
    return "house";
  }

  if (
    /(?:غرفة|مطبخ|صالون|حمام|مكتب)/.test(
      name,
    )
  ) {
    return "room";
  }

  if (
    /(?:شركة|مصنع|إدارة|مدرسة|مستشفى|مقهى|مطعم|متجر)/.test(
      name,
    )
  ) {
    return "workplace";
  }

  if (
    /(?:سيارة|حافلة|قطار|طائرة|سفينة|قارب)/.test(
      name,
    )
  ) {
    return "vehicle";
  }

  if (
    /(?:قرية|حقل|غابة|جبل|وادي|مزرعة)/.test(
      name,
    )
  ) {
    return "rural";
  }

  if (
    /(?:ساحة|حديقة|محطة|ملعب|شاطئ|قاعة)/.test(
      name,
    )
  ) {
    return "public_space";
  }

  return "other";
}

function sceneToForm(scene: Scene): SceneFormState {
  return {
    episodeId: scene.episodeId ?? "",
    locationId: scene.locationId ?? "",
    sceneNumber: scene.sceneNumber,
    title: scene.title ?? "",
    interiorExterior: scene.interiorExterior,
    timeOfDay: scene.timeOfDay,
    customTimeOfDay: scene.customTimeOfDay ?? "",
    synopsis: scene.synopsis ?? "",
    dramaticPurpose: scene.dramaticPurpose ?? "",
    notes: scene.notes ?? "",
    estimatedDurationSeconds: scene.estimatedDurationSeconds === null ? "" : String(scene.estimatedDurationSeconds),
    status: scene.status,
  };
}

function buildSceneHeading(interiorExterior: InteriorExterior, locationName: string, timeOfDay: TimeOfDay, customTimeOfDay: string): string {
  const space = interiorExterior === "interior" ? "داخلي" : interiorExterior === "exterior" ? "خارجي" : interiorExterior === "interior_exterior" ? "داخلي/خارجي" : "";
  const time = timeOfDay === "custom" ? customTimeOfDay.trim() : timeOfDayOptions.find((option) => option.value === timeOfDay && option.value !== "unspecified")?.label ?? "";
  return [space, locationName, time].filter(Boolean).join(" - ");
}

function getLocationName(locations: Location[], locationId: string): string {
  return locations.find((location) => location.id === locationId)?.name ?? "";
}

function getNextSceneNumber(scenes: Scene[], episodeId: string | null): string {
  const values = scenes.filter((scene) => scene.episodeId === episodeId).map((scene) => Number(scene.sceneNumber)).filter((value) => Number.isInteger(value) && value >= 1);
  return String((values.length > 0 ? Math.max(...values) : 0) + 1);
}

function parseOptionalNonNegativeInteger(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function getNextElementType(type: SceneElementType, content: string): SceneElementType {
  if (type === "character" || type === "parenthetical") return "dialogue";
  if (type === "dialogue") return content.trim() ? "action" : "character";
  return "action";
}

function cycleElementType(type: SceneElementType, reverse: boolean): SceneElementType {
  const index = Math.max(0, cycleTypes.indexOf(type));
  return cycleTypes[(index + (reverse ? -1 : 1) + cycleTypes.length) % cycleTypes.length];
}

function getElementShortcutNumber(
  type: SceneElementType,
): string {
  switch (type) {
    case "action":
      return "1";
    case "character":
      return "2";
    case "dialogue":
      return "3";
    case "parenthetical":
      return "4";
    case "transition":
      return "5";
    case "note":
      return "6";
    default:
      return "";
  }
}

function getElementShortcutLabel(
  type: SceneElementType,
): string {
  const number =
    getElementShortcutNumber(type);

  return number
    ? `Ctrl + ${number}`
    : "";
}

function getImportedElementLabel(
  type: SceneElementType,
): string {
  switch (type) {
    case "action":
      return "وصف";
    case "character":
      return "شخصية";
    case "dialogue":
      return "حوار";
    case "parenthetical":
      return "حالة";
    case "transition":
      return "انتقال";
    case "shot":
      return "لقطة";
    case "centered_text":
      return "نص مركزي";
    case "note":
      return "ملاحظة";
  }
}

function getElementPlaceholder(type: SceneElementType): string {
  switch (type) {
    case "action": return "اكتب الوصف والحركة وما يُرى ويُسمع...";
    case "character": return "اسم الشخصية...";
    case "dialogue": return "اكتب الحوار...";
    case "parenthetical": return "(حالة الحوار)";
    case "transition": return "قطع إلى:";
    case "shot": return "وصف اللقطة...";
    case "centered_text": return "نص مركزي...";
    case "note": return "ملاحظة للكاتب...";
  }
}

function getSaveStateLabel(state: "saved" | "dirty" | "saving" | "error"): string {
  return state === "saved" ? "تم الحفظ" : state === "dirty" ? "غير محفوظ" : state === "saving" ? "جارٍ الحفظ..." : "تعذر الحفظ";
}

function autoResizeTextarea(textarea: HTMLTextAreaElement): void {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}