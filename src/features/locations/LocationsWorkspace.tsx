import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  Location,
  LocationType,
  Project,
} from "../../types";

import type {
  UpdateLocationInput,
} from "../../application";

import {
  useLocations,
} from "./useLocations";

import "./locations-workspace.css";

interface LocationsWorkspaceProps {
  project: Project;
}

interface LocationFormState {
  name: string;
  type: LocationType;

  parentLocationId: string;

  description: string;
  notes: string;
}

type LocationTypeFilter =
  | "all"
  | LocationType;

const emptyForm:
  LocationFormState = {
    name: "",
    type: "other",

    parentLocationId: "",

    description: "",
    notes: "",
  };

export function LocationsWorkspace({
  project,
}: LocationsWorkspaceProps) {
  const {
    locations,

    isLoading,
    isSaving,
    error,

    createLocation,
    updateLocation,
    deleteLocation,

    clearError,
  } = useLocations(project.id);

  const [
    selectedLocationId,
    setSelectedLocationId,
  ] = useState<string | null>(
    null,
  );

  const [
    form,
    setForm,
  ] = useState<LocationFormState>({
    ...emptyForm,
  });

  const [
    savedForm,
    setSavedForm,
  ] = useState<LocationFormState>({
    ...emptyForm,
  });

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState<LocationTypeFilter>(
    "all",
  );

  const selectedLocation =
    locations.find(
      (location) =>
        location.id ===
        selectedLocationId,
    ) ?? null;

  const isDirty =
    !areFormsEqual(
      form,
      savedForm,
    );

  const visibleLocations =
    useMemo(() => {
      const normalizedQuery =
        searchQuery
          .trim()
          .toLocaleLowerCase();

      return locations.filter(
        (location) => {
          const matchesType =
            typeFilter === "all" ||
            location.type ===
              typeFilter;

          const searchableText = [
            location.name,
            location.description ?? "",
            location.notes ?? "",
          ]
            .join(" ")
            .toLocaleLowerCase();

          const matchesSearch =
            !normalizedQuery ||
            searchableText.includes(
              normalizedQuery,
            );

          return (
            matchesType &&
            matchesSearch
          );
        },
      );
    }, [
      locations,
      searchQuery,
      typeFilter,
    ]);

  const availableParents =
    locations.filter(
      (location) =>
        location.id !==
        selectedLocationId,
    );

  useEffect(() => {
    if (selectedLocation === null) {
      const nextForm = {
        ...emptyForm,
      };

      setForm(nextForm);
      setSavedForm(nextForm);

      return;
    }

    const nextForm =
      locationToForm(
        selectedLocation,
      );

    setForm(nextForm);
    setSavedForm(nextForm);
  }, [selectedLocation]);

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ): void {
      const isSaveShortcut =
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLocaleLowerCase() ===
          "s";

      if (!isSaveShortcut) {
        return;
      }

      event.preventDefault();

      if (
        isDirty &&
        !isSaving &&
        form.name.trim()
      ) {
        void saveCurrentLocation();
      }
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
    selectedLocation,
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

  function startNewLocation(): void {
    if (
      !confirmDiscardChanges()
    ) {
      return;
    }

    clearError();

    setSelectedLocationId(null);

    const nextForm = {
      ...emptyForm,
    };

    setForm(nextForm);
    setSavedForm(nextForm);
  }

  function selectLocation(
    locationId: string,
  ): void {
    if (
      locationId ===
      selectedLocationId
    ) {
      return;
    }

    if (
      !confirmDiscardChanges()
    ) {
      return;
    }

    clearError();

    setSelectedLocationId(
      locationId,
    );
  }

  function updateForm(
    changes:
      Partial<LocationFormState>,
  ): void {
    clearError();

    setForm(
      (currentForm) => ({
        ...currentForm,
        ...changes,
      }),
    );
  }

  async function saveCurrentLocation():
    Promise<void> {
    if (
      isSaving ||
      !form.name.trim()
    ) {
      return;
    }

    if (selectedLocation === null) {
      const createdLocation =
        await createLocation({
          name: form.name,
          type: form.type,

          parentLocationId:
            form.parentLocationId ||
            null,

          description:
            form.description,

          notes:
            form.notes,
        });

      if (
        createdLocation !== null
      ) {
        const nextForm =
          locationToForm(
            createdLocation,
          );

        setSelectedLocationId(
          createdLocation.id,
        );

        setForm(nextForm);
        setSavedForm(nextForm);
      }

      return;
    }

    const updatedLocation =
      await updateLocation(
        selectedLocation.id,
        formToUpdateInput(form),
      );

    if (
      updatedLocation !== null
    ) {
      const nextForm =
        locationToForm(
          updatedLocation,
        );

      setForm(nextForm);
      setSavedForm(nextForm);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    await saveCurrentLocation();
  }

  function restoreSavedForm(): void {
    setForm({
      ...savedForm,
    });

    clearError();
  }

  async function handleDelete():
    Promise<void> {
    if (
      selectedLocation === null
    ) {
      return;
    }

    const childCount =
      locations.filter(
        (location) =>
          location.parentLocationId ===
          selectedLocation.id,
      ).length;

    const childWarning =
      childCount > 0
        ? `\n\nسيصبح ${childCount} من الأماكن الفرعية دون مكان أب.`
        : "";

    const confirmed =
      window.confirm(
        `هل تريد حذف مكان «${selectedLocation.name}»؟${childWarning}\n\nلن يمكن التراجع عن هذا الإجراء.`,
      );

    if (!confirmed) {
      return;
    }

    const deleted =
      await deleteLocation(
        selectedLocation.id,
      );

    if (deleted) {
      setSelectedLocationId(null);

      const nextForm = {
        ...emptyForm,
      };

      setForm(nextForm);
      setSavedForm(nextForm);
    }
  }

  return (
    <main
      className="locations-workspace"
      dir="rtl"
    >
      <header className="locations-header">
        <div>
          <span className="locations-kicker">
            {project.title}
          </span>

          <h1>الأماكن</h1>

          <p>
            بناء فضاءات العمل الدرامي
            وتنظيم الأماكن الرئيسية
            والفرعية.
          </p>
        </div>

        <button
          type="button"
          className="locations-primary-button"
          onClick={startNewLocation}
        >
          مكان جديد
        </button>
      </header>

      {error !== null && (
        <div
          className="locations-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="locations-layout">
        <aside className="locations-list-panel">
          <div className="locations-list-heading">
            <strong>
              أماكن المشروع
            </strong>

            <span>
              {visibleLocations.length}

              {visibleLocations.length !==
                locations.length &&
                ` / ${locations.length}`}
            </span>
          </div>

          <div className="locations-list-tools">
            <input
              type="search"
              value={searchQuery}
              placeholder="البحث عن مكان..."
              onChange={(event) => {
                setSearchQuery(
                  event.target.value,
                );
              }}
            />

            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(
                  event.target
                    .value as LocationTypeFilter,
                );
              }}
            >
              <option value="all">
                جميع الأنواع
              </option>

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
          </div>

          {isLoading ? (
            <div className="locations-list-state">
              جارٍ تحميل الأماكن...
            </div>
          ) : locations.length === 0 ? (
            <div className="locations-list-state">
              لم يُنشأ أي مكان بعد.
            </div>
          ) : visibleLocations.length ===
            0 ? (
            <div className="locations-list-state">
              لا يوجد مكان مطابق
              للبحث أو التصفية.
            </div>
          ) : (
            <div className="locations-list">
              {visibleLocations.map(
                (location) => (
                  <button
                    key={location.id}
                    type="button"
                    className={
                      location.id ===
                      selectedLocationId
                        ? "location-list-item is-active"
                        : "location-list-item"
                    }
                    onClick={() => {
                      selectLocation(
                        location.id,
                      );
                    }}
                  >
                    <span className="location-list-symbol">
                      {getLocationTypeSymbol(
                        location.type,
                      )}
                    </span>

                    <span className="location-list-copy">
                      <strong>
                        {location.name}
                      </strong>

                      <small>
                        {getLocationTypeLabel(
                          location.type,
                        )}

                        {location.parentLocationId
                          ? ` · تابع لـ${getParentName(
                              locations,
                              location.parentLocationId,
                            )}`
                          : ""}
                      </small>
                    </span>
                  </button>
                ),
              )}
            </div>
          )}
        </aside>

        <section className="location-editor-panel">
          <div className="location-editor-heading">
            <div>
              <span>
                {selectedLocation === null
                  ? "إضافة مكان"
                  : "تحرير المكان"}
              </span>

              <h2>
                {selectedLocation?.name ??
                  "مكان جديد"}
              </h2>
            </div>

            <div className="location-editor-status">
              <span
                className={
                  isDirty
                    ? "location-save-status is-dirty"
                    : "location-save-status"
                }
              >
                {isSaving
                  ? "جارٍ الحفظ..."
                  : isDirty
                    ? "تغييرات غير محفوظة"
                    : selectedLocation ===
                        null
                      ? "نموذج جديد"
                      : "جميع التغييرات محفوظة"}
              </span>

              {selectedLocation !== null && (
                <button
                  type="button"
                  className="locations-danger-button"
                  disabled={isSaving}
                  onClick={() => {
                    void handleDelete();
                  }}
                >
                  حذف المكان
                </button>
              )}
            </div>
          </div>

          <form
            className="location-form"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <label className="location-form-field">
              <span>اسم المكان</span>

              <input
                type="text"
                required
                value={form.name}
                placeholder="مثال: البيت القديم"
                onChange={(event) => {
                  updateForm({
                    name:
                      event.target.value,
                  });
                }}
              />
            </label>

            <label className="location-form-field">
              <span>نوع المكان</span>

              <select
                value={form.type}
                onChange={(event) => {
                  updateForm({
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
            </label>

            <label className="location-form-field location-form-field--full">
              <span>المكان الأب</span>

              <select
                value={
                  form.parentLocationId
                }
                onChange={(event) => {
                  updateForm({
                    parentLocationId:
                      event.target.value,
                  });
                }}
              >
                <option value="">
                  مكان رئيسي مستقل
                </option>

                {availableParents.map(
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

              <small>
                مثال: يمكن جعل «المطبخ»
                تابعًا لـ«البيت القديم».
              </small>
            </label>

            <label className="location-form-field location-form-field--full">
              <span>وصف المكان</span>

              <textarea
                rows={7}
                value={form.description}
                placeholder="الوصف البصري والدرامي للمكان، حالته، أجواؤه، وما يميزه..."
                onChange={(event) => {
                  updateForm({
                    description:
                      event.target.value,
                  });
                }}
              />
            </label>

            <label className="location-form-field location-form-field--full">
              <span>ملاحظات</span>

              <textarea
                rows={5}
                value={form.notes}
                placeholder="ملاحظات إنتاجية أو درامية إضافية..."
                onChange={(event) => {
                  updateForm({
                    notes:
                      event.target.value,
                  });
                }}
              />
            </label>

            <div className="location-form-actions">
              <button
                type="button"
                className="locations-secondary-button"
                disabled={
                  isSaving ||
                  !isDirty
                }
                onClick={
                  restoreSavedForm
                }
              >
                التراجع عن التغييرات
              </button>

              <button
                type="submit"
                className="locations-primary-button"
                disabled={
                  isSaving ||
                  !isDirty ||
                  !form.name.trim()
                }
                title="حفظ المكان — Ctrl + S"
              >
                {isSaving
                  ? "جارٍ الحفظ..."
                  : selectedLocation ===
                      null
                    ? "إنشاء المكان"
                    : "حفظ التعديلات"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

interface LocationTypeOption {
  value: LocationType;
  label: string;
}

const locationTypeOptions:
  LocationTypeOption[] = [
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

function locationToForm(
  location: Location,
): LocationFormState {
  return {
    name: location.name,
    type: location.type,

    parentLocationId:
      location.parentLocationId ??
      "",

    description:
      location.description ?? "",

    notes:
      location.notes ?? "",
  };
}

function formToUpdateInput(
  form: LocationFormState,
): UpdateLocationInput {
  return {
    name: form.name,
    type: form.type,

    parentLocationId:
      form.parentLocationId ||
      null,

    description:
      form.description || null,

    notes:
      form.notes || null,
  };
}

function areFormsEqual(
  firstForm: LocationFormState,
  secondForm: LocationFormState,
): boolean {
  return (
    JSON.stringify(firstForm) ===
    JSON.stringify(secondForm)
  );
}

function getParentName(
  locations: Location[],
  parentLocationId: string,
): string {
  const parentLocation =
    locations.find(
      (location) =>
        location.id ===
        parentLocationId,
    );

  return parentLocation
    ? ` «${parentLocation.name}»`
    : " مكان غير موجود";
}

function getLocationTypeLabel(
  type: LocationType,
): string {
  return (
    locationTypeOptions.find(
      (option) =>
        option.value === type,
    )?.label ??
    "مكان آخر"
  );
}

function getLocationTypeSymbol(
  type: LocationType,
): string {
  switch (type) {
    case "house":
      return "ب";

    case "room":
      return "غ";

    case "street":
      return "ش";

    case "workplace":
      return "ع";

    case "public_space":
      return "ف";

    case "vehicle":
      return "ن";

    case "rural":
      return "ق";

    case "other":
      return "م";
  }
}