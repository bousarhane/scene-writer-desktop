import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  Episode,
  InteriorExterior,
  Location,
  LocationType,
  Project,
  Scene,
  SceneStatus,
  TimeOfDay,
} from "../../types";

import type {
  UpdateSceneInput,
} from "../../application";

import {
  useScenesWorkspace,
} from "./useScenesWorkspace";

import "./scenes-workspace.css";

interface ScenesWorkspaceProps {
  project: Project;
}

interface SceneFormState {
  episodeId: string;
  locationId: string;

  sceneNumber: string;
  title: string;

  interiorExterior:
    InteriorExterior;

  timeOfDay: TimeOfDay;
  customTimeOfDay: string;

  synopsis: string;
  dramaticPurpose: string;
  notes: string;

  estimatedDurationSeconds:
    string;

  status: SceneStatus;
}

interface QuickLocationFormState {
  name: string;
  type: LocationType;
}

const emptySceneForm:
  SceneFormState = {
    episodeId: "",
    locationId: "",

    sceneNumber: "",
    title: "",

    interiorExterior:
      "unspecified",

    timeOfDay:
      "unspecified",

    customTimeOfDay: "",

    synopsis: "",
    dramaticPurpose: "",
    notes: "",

    estimatedDurationSeconds:
      "",

    status: "draft",
  };

const emptyQuickLocationForm:
  QuickLocationFormState = {
    name: "",
    type: "other",
  };

export function ScenesWorkspace({
  project,
}: ScenesWorkspaceProps) {
  const {
    scenes,
    episodes,
    locations,

    usesEpisodes,

    isLoading,
    isSaving,
    error,

    createScene,
    updateScene,
    deleteScene,

    createQuickLocation,

    clearError,
  } = useScenesWorkspace(
    project,
  );

  const [
    selectedSceneId,
    setSelectedSceneId,
  ] = useState<string | null>(
    null,
  );

  const [
    activeEpisodeFilter,
    setActiveEpisodeFilter,
  ] = useState<string>("all");

  const [
    form,
    setForm,
  ] = useState<SceneFormState>({
    ...emptySceneForm,
  });

  const [
    savedForm,
    setSavedForm,
  ] = useState<SceneFormState>({
    ...emptySceneForm,
  });

  const [
    isQuickLocationOpen,
    setIsQuickLocationOpen,
  ] = useState(false);

  const [
    quickLocationForm,
    setQuickLocationForm,
  ] = useState<QuickLocationFormState>({
    ...emptyQuickLocationForm,
  });

  const selectedScene =
    scenes.find(
      (scene) =>
        scene.id ===
        selectedSceneId,
    ) ?? null;

  const filteredScenes =
    useMemo(() => {
      if (!usesEpisodes) {
        return scenes;
      }

      if (
        activeEpisodeFilter ===
        "all"
      ) {
        return scenes;
      }

      if (
        activeEpisodeFilter ===
        "unassigned"
      ) {
        return scenes.filter(
          (scene) =>
            scene.episodeId === null,
        );
      }

      return scenes.filter(
        (scene) =>
          scene.episodeId ===
          activeEpisodeFilter,
      );
    }, [
      scenes,
      usesEpisodes,
      activeEpisodeFilter,
    ]);

  const isDirty =
    JSON.stringify(form) !==
    JSON.stringify(savedForm);

  const locationName =
    getLocationName(
      locations,
      form.locationId,
    );

  const heading =
    buildSceneHeading(
      form.interiorExterior,
      locationName,
      form.timeOfDay,
      form.customTimeOfDay,
    );

  useEffect(() => {
    if (selectedScene === null) {
      return;
    }

    const nextForm =
      sceneToForm(
        selectedScene,
      );

    setForm(nextForm);
    setSavedForm(nextForm);
  }, [selectedScene]);

  useEffect(() => {
    if (
      project.projectType !==
        "single_episode" ||
      selectedScene !== null ||
      form.episodeId ||
      episodes.length === 0
    ) {
      return;
    }

    setForm(
      (currentForm) => ({
        ...currentForm,
        episodeId:
          episodes[0].id,
      }),
    );
  }, [
    project.projectType,
    selectedScene,
    form.episodeId,
    episodes,
  ]);

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ): void {
      const isSaveShortcut =
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        event.key
          .toLocaleLowerCase() ===
          "s";

      if (
        !isSaveShortcut ||
        !isDirty ||
        isSaving
      ) {
        return;
      }

      event.preventDefault();

      void saveCurrentScene();
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    form,
    isDirty,
    isSaving,
    selectedScene,
    heading,
  ]);

  useEffect(() => {
    function handleBeforeUnload(
      event: BeforeUnloadEvent,
    ): void {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload,
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload,
      );
    };
  }, [isDirty]);

  function confirmDiscardChanges():
    boolean {
    if (!isDirty) {
      return true;
    }

    return window.confirm(
      "توجد تغييرات غير محفوظة.\n\nهل تريد تجاهلها والمتابعة؟",
    );
  }

  function startNewScene(): void {
    if (!confirmDiscardChanges()) {
      return;
    }

    clearError();

    setSelectedSceneId(null);

    const defaultEpisodeId =
      getDefaultEpisodeId(
        project,
        episodes,
        activeEpisodeFilter,
      );

    const nextForm:
      SceneFormState = {
        ...emptySceneForm,

        episodeId:
          defaultEpisodeId,

        sceneNumber:
          getNextSceneNumber(
            scenes,
            defaultEpisodeId ||
              null,
          ),
      };

    setForm(nextForm);

    setSavedForm({
      ...emptySceneForm,
    });
  }

  function selectScene(
    scene: Scene,
  ): void {
    if (
      scene.id ===
      selectedSceneId
    ) {
      return;
    }

    if (!confirmDiscardChanges()) {
      return;
    }

    clearError();

    setSelectedSceneId(
      scene.id,
    );

    const nextForm =
      sceneToForm(scene);

    setForm(nextForm);
    setSavedForm(nextForm);
  }

  function updateForm(
    changes:
      Partial<SceneFormState>,
  ): void {
    clearError();

    setForm(
      (currentForm) => ({
        ...currentForm,
        ...changes,
      }),
    );
  }

  async function saveCurrentScene():
    Promise<void> {
    if (
      isSaving ||
      !form.sceneNumber.trim()
    ) {
      return;
    }

    const estimatedDurationSeconds =
      parseOptionalNonNegativeInteger(
        form
          .estimatedDurationSeconds,
      );

    if (
      form.timeOfDay ===
        "custom" &&
      !form.customTimeOfDay.trim()
    ) {
      return;
    }

    if (selectedScene === null) {
      const createdScene =
        await createScene({
          episodeId:
            usesEpisodes
              ? form.episodeId ||
                null
              : null,

          locationId:
            form.locationId ||
            null,

          sceneNumber:
            form.sceneNumber,

          title:
            form.title,

          heading,

          interiorExterior:
            form.interiorExterior,

          timeOfDay:
            form.timeOfDay,

          customTimeOfDay:
            form.customTimeOfDay,

          synopsis:
            form.synopsis,

          dramaticPurpose:
            form.dramaticPurpose,

          notes:
            form.notes,

          estimatedDurationSeconds,

          status:
            form.status,
        });

      if (createdScene !== null) {
        setSelectedSceneId(
          createdScene.id,
        );

        const nextForm =
          sceneToForm(
            createdScene,
          );

        setForm(nextForm);
        setSavedForm(nextForm);
      }

      return;
    }

    const input:
      UpdateSceneInput = {
        episodeId:
          usesEpisodes
            ? form.episodeId ||
              null
            : null,

        locationId:
          form.locationId ||
          null,

        sceneNumber:
          form.sceneNumber,

        title:
          form.title ||
          null,

        heading,

        interiorExterior:
          form.interiorExterior,

        timeOfDay:
          form.timeOfDay,

        customTimeOfDay:
          form.customTimeOfDay ||
          null,

        synopsis:
          form.synopsis ||
          null,

        dramaticPurpose:
          form.dramaticPurpose ||
          null,

        notes:
          form.notes ||
          null,

        estimatedDurationSeconds,

        status:
          form.status,

        orderIndex:
          selectedScene.orderIndex,
      };

    const updatedScene =
      await updateScene(
        selectedScene.id,
        input,
      );

    if (updatedScene !== null) {
      const nextForm =
        sceneToForm(
          updatedScene,
        );

      setForm(nextForm);
      setSavedForm(nextForm);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    await saveCurrentScene();
  }

  async function handleDelete():
    Promise<void> {
    if (selectedScene === null) {
      return;
    }

    const confirmed =
      window.confirm(
        `هل تريد حذف المشهد «${selectedScene.sceneNumber}»؟\n\nسيُحذف لاحقًا معه نص المشهد وعناصره، ولن يمكن التراجع عن العملية.`,
      );

    if (!confirmed) {
      return;
    }

    const deleted =
      await deleteScene(
        selectedScene.id,
      );

    if (deleted) {
      setSelectedSceneId(null);

      setForm({
        ...emptySceneForm,
      });

      setSavedForm({
        ...emptySceneForm,
      });
    }
  }

  async function handleQuickLocationSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (
      !quickLocationForm.name.trim()
    ) {
      return;
    }

    const createdLocation =
      await createQuickLocation({
        name:
          quickLocationForm.name,

        type:
          quickLocationForm.type,

        parentLocationId:
          null,

        description:
          null,

        notes:
          null,
      });

    if (createdLocation === null) {
      return;
    }

    updateForm({
      locationId:
        createdLocation.id,
    });

    setQuickLocationForm({
      ...emptyQuickLocationForm,
    });

    setIsQuickLocationOpen(false);
  }

  return (
    <main
      className="scenes-workspace"
      dir="rtl"
    >
      <header className="scenes-header">
        <div>
          <span className="scenes-kicker">
            {project.title}
          </span>

          <h1>التحرير</h1>

          <p>
            اكتب مشاهد العمل ونظّم
            بياناتها بحسب نوع المشروع،
            من غير فرض بنية الحلقات على
            الفيلم أو المسرحية.
          </p>
        </div>

        <button
          type="button"
          className="scenes-primary-button"
          onClick={startNewScene}
        >
          مشهد جديد
        </button>
      </header>

      {error !== null && (
        <div
          className="scenes-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="scenes-layout">
        <aside className="scenes-list-panel">
          <div className="scenes-panel-heading">
            <strong>
              مشاهد المشروع
            </strong>

            <span>
              {filteredScenes.length}
            </span>
          </div>

          {project.projectType ===
            "series" && (
            <div className="scenes-filter">
              <select
                value={
                  activeEpisodeFilter
                }
                onChange={(event) => {
                  setActiveEpisodeFilter(
                    event.target.value,
                  );
                }}
              >
                <option value="all">
                  جميع المشاهد
                </option>

                <option value="unassigned">
                  مشاهد غير موزعة
                </option>

                {episodes.map(
                  (episode) => (
                    <option
                      key={episode.id}
                      value={episode.id}
                    >
                      الحلقة{" "}
                      {episode.number}
                      {episode.title
                        ? ` — ${episode.title}`
                        : ""}
                    </option>
                  ),
                )}
              </select>
            </div>
          )}

          {isLoading ? (
            <div className="scenes-empty">
              جارٍ تحميل المشاهد...
            </div>
          ) : filteredScenes.length ===
            0 ? (
            <div className="scenes-empty">
              لا توجد مشاهد في هذا
              القسم.
            </div>
          ) : (
            <div className="scenes-list">
              {filteredScenes.map(
                (scene) => (
                  <button
                    key={scene.id}
                    type="button"
                    className={
                      scene.id ===
                      selectedSceneId
                        ? "scene-list-item is-active"
                        : "scene-list-item"
                    }
                    onClick={() => {
                      selectScene(
                        scene,
                      );
                    }}
                  >
                    <span className="scene-list-number">
                      {
                        scene.sceneNumber
                      }
                    </span>

                    <span className="scene-list-copy">
                      <strong>
                        {scene.title ??
					(
						scene.heading ||
    `					المشهد ${scene.sceneNumber}`
					)}
                      </strong>

                      {usesEpisodes && (
                        <small>
                          {getEpisodeLabel(
                            episodes,
                            scene.episodeId,
                          )}
                        </small>
                      )}

                      <small>
                        {scene.heading ||
                          "رأس المشهد غير محدد"}
                      </small>
                    </span>
                  </button>
                ),
              )}
            </div>
          )}
        </aside>

        <section className="scene-editor-panel">
          <div className="scene-editor-heading">
            <div>
              <span>
                {selectedScene === null
                  ? "إنشاء مشهد"
                  : "بيانات المشهد"}
              </span>

              <h2>
                {selectedScene?.title ??
                  (
                    form.sceneNumber
                      ? `المشهد ${form.sceneNumber}`
                      : "مشهد جديد"
                  )}
              </h2>
            </div>

            <div className="scene-editor-actions">
              <span
                className={
                  isDirty
                    ? "scene-save-status is-dirty"
                    : "scene-save-status"
                }
              >
                {isSaving
                  ? "جارٍ الحفظ..."
                  : isDirty
                    ? "تغييرات غير محفوظة"
                    : selectedScene ===
                        null
                      ? "مشهد جديد"
                      : "جميع التغييرات محفوظة"}
              </span>

              {selectedScene !==
                null && (
                <button
                  type="button"
                  className="scenes-danger-button"
                  disabled={isSaving}
                  onClick={() => {
                    void handleDelete();
                  }}
                >
                  حذف المشهد
                </button>
              )}
            </div>
          </div>

          <form
            className="scene-form"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <label>
              <span>رقم المشهد</span>

              <input
                type="text"
                required
                value={
                  form.sceneNumber
                }
                placeholder="1"
                onChange={(event) => {
                  updateForm({
                    sceneNumber:
                      event.target.value,
                  });
                }}
              />
            </label>

            <label>
              <span>عنوان المشهد</span>

              <input
                type="text"
                value={form.title}
                placeholder="عنوان اختياري"
                onChange={(event) => {
                  updateForm({
                    title:
                      event.target.value,
                  });
                }}
              />
            </label>

            {project.projectType ===
              "series" && (
              <label className="scene-form-full">
                <span>الحلقة</span>

                <select
                  value={form.episodeId}
                  onChange={(event) => {
                    const nextEpisodeId =
                      event.target.value;

                    updateForm({
                      episodeId:
                        nextEpisodeId,

                      sceneNumber:
                        selectedScene ===
                        null
                          ? getNextSceneNumber(
                              scenes,
                              nextEpisodeId ||
                                null,
                            )
                          : form.sceneNumber,
                    });
                  }}
                >
                  <option value="">
                    غير موزع على حلقة
                  </option>

                  {episodes.map(
                    (episode) => (
                      <option
                        key={episode.id}
                        value={episode.id}
                      >
                        الحلقة{" "}
                        {episode.number}
                        {episode.title
                          ? ` — ${episode.title}`
                          : ""}
                      </option>
                    ),
                  )}
                </select>
              </label>
            )}

            <label>
              <span>
                داخلي أو خارجي
              </span>

              <select
                value={
                  form.interiorExterior
                }
                onChange={(event) => {
                  updateForm({
                    interiorExterior:
                      event.target
                        .value as InteriorExterior,
                  });
                }}
              >
                <option value="unspecified">
                  غير محدد
                </option>

                <option value="interior">
                  داخلي
                </option>

                <option value="exterior">
                  خارجي
                </option>

                <option value="interior_exterior">
                  داخلي / خارجي
                </option>
              </select>
            </label>

            <label>
              <span>الزمن</span>

              <select
                value={form.timeOfDay}
                onChange={(event) => {
                  updateForm({
                    timeOfDay:
                      event.target
                        .value as TimeOfDay,

                    customTimeOfDay:
                      event.target
                        .value ===
                        "custom"
                        ? form
                            .customTimeOfDay
                        : "",
                  });
                }}
              >
                {timeOfDayOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </label>

            {form.timeOfDay ===
              "custom" && (
              <label className="scene-form-full">
                <span>
                  التحديد الزمني الخاص
                </span>

                <input
                  type="text"
                  required
                  value={
                    form.customTimeOfDay
                  }
                  placeholder="بعد قليل، قبل الغروب، في الوقت نفسه..."
                  onChange={(event) => {
                    updateForm({
                      customTimeOfDay:
                        event.target.value,
                    });
                  }}
                />
              </label>
            )}

            <div className="scene-location-field scene-form-full">
              <label>
                <span>المكان</span>

                <select
                  value={
                    form.locationId
                  }
                  onChange={(event) => {
                    updateForm({
                      locationId:
                        event.target.value,
                    });
                  }}
                >
                  <option value="">
                    مكان غير محدد
                  </option>

                  {locations.map(
                    (location) => (
                      <option
                        key={location.id}
                        value={location.id}
                      >
                        {location.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <button
                type="button"
                className="scenes-secondary-button"
                onClick={() => {
                  setIsQuickLocationOpen(
                    (currentValue) =>
                      !currentValue,
                  );
                }}
              >
                {isQuickLocationOpen
                  ? "إغلاق"
                  : "مكان جديد"}
              </button>
            </div>

            {isQuickLocationOpen && (
              <div className="quick-location-panel scene-form-full">
                <div>
                  <strong>
                    إضافة مكان سريع
                  </strong>

                  <p>
                    سيُحفظ المكان مباشرة
                    في مخزن الأماكن،
                    ويمكن استكمال بطاقته
                    لاحقًا.
                  </p>
                </div>

                <form
                  className="quick-location-form"
                  onSubmit={(event) => {
                    void handleQuickLocationSubmit(
                      event,
                    );
                  }}
                >
                  <input
                    type="text"
                    required
                    value={
                      quickLocationForm.name
                    }
                    placeholder="اسم المكان"
                    onChange={(event) => {
                      setQuickLocationForm({
                        ...quickLocationForm,

                        name:
                          event.target.value,
                      });
                    }}
                  />

                  <select
                    value={
                      quickLocationForm.type
                    }
                    onChange={(event) => {
                      setQuickLocationForm({
                        ...quickLocationForm,

                        type:
                          event.target
                            .value as LocationType,
                      });
                    }}
                  >
                    {locationTypeOptions.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>

                  <button
                    type="submit"
                    className="scenes-primary-button"
                    disabled={
                      isSaving ||
                      !quickLocationForm.name.trim()
                    }
                  >
                    حفظ المكان
                  </button>
                </form>
              </div>
            )}

            <div className="scene-heading-preview scene-form-full">
              <span>رأس المشهد</span>

              <strong>
                {heading ||
                  "لم يكتمل رأس المشهد بعد"}
              </strong>
            </div>

            <label>
              <span>حالة المشهد</span>

              <select
                value={form.status}
                onChange={(event) => {
                  updateForm({
                    status:
                      event.target
                        .value as SceneStatus,
                  });
                }}
              >
                <option value="draft">
                  مسودة
                </option>

                <option value="review">
                  قيد المراجعة
                </option>

                <option value="approved">
                  معتمد
                </option>

                <option value="omitted">
                  مستبعد
                </option>
              </select>
            </label>

            <label>
              <span>
                المدة التقديرية بالثواني
              </span>

              <input
                type="number"
                min={0}
                value={
                  form
                    .estimatedDurationSeconds
                }
                placeholder="اختياري"
                onChange={(event) => {
                  updateForm({
                    estimatedDurationSeconds:
                      event.target.value,
                  });
                }}
              />
            </label>

            <label className="scene-form-full">
              <span>ملخص المشهد</span>

              <textarea
                rows={5}
                value={form.synopsis}
                placeholder="ماذا يحدث في هذا المشهد؟"
                onChange={(event) => {
                  updateForm({
                    synopsis:
                      event.target.value,
                  });
                }}
              />
            </label>

            <label className="scene-form-full">
              <span>
                الوظيفة الدرامية
              </span>

              <textarea
                rows={4}
                value={
                  form.dramaticPurpose
                }
                placeholder="ما الذي يغيره المشهد في الحكاية أو الشخصيات؟"
                onChange={(event) => {
                  updateForm({
                    dramaticPurpose:
                      event.target.value,
                  });
                }}
              />
            </label>

            <label className="scene-form-full">
              <span>ملاحظات</span>

              <textarea
                rows={4}
                value={form.notes}
                placeholder="ملاحظات إضافية..."
                onChange={(event) => {
                  updateForm({
                    notes:
                      event.target.value,
                  });
                }}
              />
            </label>

            <div className="scene-form-actions scene-form-full">
              <button
                type="button"
                className="scenes-secondary-button"
                disabled={
                  isSaving ||
                  !isDirty
                }
                onClick={() => {
                  setForm({
                    ...savedForm,
                  });

                  clearError();
                }}
              >
                التراجع عن التغييرات
              </button>

              <button
                type="submit"
                className="scenes-primary-button"
                disabled={
                  isSaving ||
                  !isDirty ||
                  !form.sceneNumber.trim() ||
                  (
                    form.timeOfDay ===
                      "custom" &&
                    !form.customTimeOfDay.trim()
                  )
                }
                title="حفظ المشهد — Ctrl + S"
              >
                {isSaving
                  ? "جارٍ الحفظ..."
                  : selectedScene ===
                      null
                    ? "إنشاء المشهد"
                    : "حفظ المشهد"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

interface SelectOption<T> {
  value: T;
  label: string;
}

const timeOfDayOptions:
  SelectOption<TimeOfDay>[] = [
    {
      value: "unspecified",
      label: "غير محدد",
    },
    {
      value: "day",
      label: "نهار",
    },
    {
      value: "night",
      label: "ليل",
    },
    {
      value: "morning",
      label: "صباح",
    },
    {
      value: "evening",
      label: "مساء",
    },
    {
      value: "dawn",
      label: "فجر",
    },
    {
      value: "sunset",
      label: "غروب",
    },
    {
      value: "continuous",
      label: "استمرار",
    },
    {
      value: "later",
      label: "لاحقًا",
    },
    {
      value: "custom",
      label: "زمن خاص",
    },
  ];

const locationTypeOptions:
  SelectOption<LocationType>[] = [
    {
      value: "house",
      label: "بيت أو مسكن",
    },
    {
      value: "room",
      label: "غرفة أو فضاء داخلي",
    },
    {
      value: "street",
      label: "شارع أو طريق",
    },
    {
      value: "workplace",
      label: "مكان عمل",
    },
    {
      value: "public_space",
      label: "فضاء عام",
    },
    {
      value: "vehicle",
      label: "وسيلة نقل",
    },
    {
      value: "rural",
      label: "فضاء قروي أو طبيعي",
    },
    {
      value: "other",
      label: "مكان آخر",
    },
  ];

function sceneToForm(
  scene: Scene,
): SceneFormState {
  return {
    episodeId:
      scene.episodeId ?? "",

    locationId:
      scene.locationId ?? "",

    sceneNumber:
      scene.sceneNumber,

    title:
      scene.title ?? "",

    interiorExterior:
      scene.interiorExterior,

    timeOfDay:
      scene.timeOfDay,

    customTimeOfDay:
      scene.customTimeOfDay ??
      "",

    synopsis:
      scene.synopsis ?? "",

    dramaticPurpose:
      scene.dramaticPurpose ??
      "",

    notes:
      scene.notes ?? "",

    estimatedDurationSeconds:
      scene
        .estimatedDurationSeconds ===
      null
        ? ""
        : String(
            scene
              .estimatedDurationSeconds,
          ),

    status:
      scene.status,
  };
}

function buildSceneHeading(
  interiorExterior:
    InteriorExterior,

  locationName: string,

  timeOfDay: TimeOfDay,

  customTimeOfDay: string,
): string {
  const spaceLabel =
    getInteriorExteriorLabel(
      interiorExterior,
    );

  const timeLabel =
    timeOfDay === "custom"
      ? customTimeOfDay.trim()
      : getTimeOfDayLabel(
          timeOfDay,
        );

  return [
    spaceLabel,
    locationName,
    timeLabel,
  ]
    .filter(Boolean)
    .join(" - ");
}

function getInteriorExteriorLabel(
  value: InteriorExterior,
): string {
  switch (value) {
    case "interior":
      return "داخلي";

    case "exterior":
      return "خارجي";

    case "interior_exterior":
      return "داخلي/خارجي";

    case "unspecified":
      return "";
  }
}

function getTimeOfDayLabel(
  value: TimeOfDay,
): string {
  return (
    timeOfDayOptions.find(
      (option) =>
        option.value === value,
    )?.label === "غير محدد"
      ? ""
      : timeOfDayOptions.find(
          (option) =>
            option.value === value,
        )?.label ?? ""
  );
}

function getLocationName(
  locations: Location[],
  locationId: string,
): string {
  if (!locationId) {
    return "";
  }

  return (
    locations.find(
      (location) =>
        location.id ===
        locationId,
    )?.name ?? ""
  );
}

function getEpisodeLabel(
  episodes: Episode[],
  episodeId: string | null,
): string {
  if (episodeId === null) {
    return "غير موزع على حلقة";
  }

  const episode =
    episodes.find(
      (candidate) =>
        candidate.id ===
        episodeId,
    );

  return episode
    ? `الحلقة ${episode.number}`
    : "حلقة غير موجودة";
}

function getDefaultEpisodeId(
  project: Project,
  episodes: Episode[],
  activeEpisodeFilter: string,
): string {
  if (
    activeEpisodeFilter !== "all" &&
    activeEpisodeFilter !==
      "unassigned"
  ) {
    return activeEpisodeFilter;
  }

  if (
    project.projectType ===
      "single_episode" &&
    episodes.length > 0
  ) {
    return episodes[0].id;
  }

  return "";
}

function getNextSceneNumber(
  scenes: Scene[],
  episodeId: string | null,
): string {
  const numericNumbers =
    scenes
      .filter(
        (scene) =>
          scene.episodeId ===
          episodeId,
      )
      .map((scene) =>
        Number(scene.sceneNumber),
      )
      .filter(
        (value) =>
          Number.isInteger(value) &&
          value >= 1,
      );

  const maximum =
    numericNumbers.length === 0
      ? 0
      : Math.max(
          ...numericNumbers,
        );

  return String(maximum + 1);
}

function parseOptionalNonNegativeInteger(
  value: string,
): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsedValue =
    Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 0
  ) {
    return null;
  }

  return parsedValue;
}