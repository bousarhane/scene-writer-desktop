import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  Character,
  CharacterGender,
  CharacterRole,
  Project,
} from "../../types";

import type {
  UpdateCharacterInput,
} from "../../application";

import {
  useCharacters,
} from "./useCharacters";

import "./characters-workspace.css";

interface CharactersWorkspaceProps {
  project: Project;
}

interface CharacterFormState {
  name: string;
  shortName: string;

  gender: CharacterGender;
  age: string;
  role: CharacterRole;

  physicalDescription: string;
  personality: string;
  psychologicalProfile: string;

  goals: string;
  motivations: string;
  background: string;

  notes: string;
}

type CharacterRoleFilter =
  | "all"
  | CharacterRole;

const emptyForm: CharacterFormState = {
  name: "",
  shortName: "",

  gender: "unspecified",
  age: "",
  role: "unspecified",

  physicalDescription: "",
  personality: "",
  psychologicalProfile: "",

  goals: "",
  motivations: "",
  background: "",

  notes: "",
};

export function CharactersWorkspace({
  project,
}: CharactersWorkspaceProps) {
  const {
    characters,
    isLoading,
    isSaving,
    error,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    clearError,
  } = useCharacters(project.id);

  const [
    selectedCharacterId,
    setSelectedCharacterId,
  ] = useState<string | null>(
    null,
  );

  const [
    form,
    setForm,
  ] = useState<CharacterFormState>({
    ...emptyForm,
  });

  const [
    savedForm,
    setSavedForm,
  ] = useState<CharacterFormState>({
    ...emptyForm,
  });

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    roleFilter,
    setRoleFilter,
  ] = useState<CharacterRoleFilter>(
    "all",
  );

  const selectedCharacter =
    characters.find(
      (character) =>
        character.id ===
        selectedCharacterId,
    ) ?? null;

  const isDirty =
    !areFormsEqual(
      form,
      savedForm,
    );

  const visibleCharacters =
    useMemo(() => {
      const normalizedQuery =
        searchQuery
          .trim()
          .toLocaleLowerCase();

      return characters.filter(
        (character) => {
          const matchesRole =
            roleFilter === "all" ||
            character.role ===
              roleFilter;

          const searchableText = [
            character.name,
            character.shortName ?? "",
            character.age ?? "",
          ]
            .join(" ")
            .toLocaleLowerCase();

          const matchesSearch =
            !normalizedQuery ||
            searchableText.includes(
              normalizedQuery,
            );

          return (
            matchesRole &&
            matchesSearch
          );
        },
      );
    }, [
      characters,
      roleFilter,
      searchQuery,
    ]);

  useEffect(() => {
    if (selectedCharacter === null) {
      const nextForm = {
        ...emptyForm,
      };

      setForm(nextForm);
      setSavedForm(nextForm);

      return;
    }

    const nextForm =
      characterToForm(
        selectedCharacter,
      );

    setForm(nextForm);
    setSavedForm(nextForm);
  }, [selectedCharacter]);

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
        void saveCurrentCharacter();
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
    selectedCharacter,
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

  function startNewCharacter(): void {
    if (
      !confirmDiscardChanges()
    ) {
      return;
    }

    clearError();

    setSelectedCharacterId(null);

    const nextForm = {
      ...emptyForm,
    };

    setForm(nextForm);
    setSavedForm(nextForm);
  }

  function selectCharacter(
    characterId: string,
  ): void {
    if (
      characterId ===
      selectedCharacterId
    ) {
      return;
    }

    if (
      !confirmDiscardChanges()
    ) {
      return;
    }

    clearError();

    setSelectedCharacterId(
      characterId,
    );
  }

  function updateForm(
    changes: Partial<CharacterFormState>,
  ): void {
    clearError();

    setForm(
      (currentForm) => ({
        ...currentForm,
        ...changes,
      }),
    );
  }

  async function saveCurrentCharacter():
    Promise<void> {
    if (
      isSaving ||
      !form.name.trim()
    ) {
      return;
    }

    if (selectedCharacter === null) {
      const createdCharacter =
        await createCharacter({
          name: form.name,
          shortName: form.shortName,

          gender: form.gender,
          age: form.age,
          role: form.role,

          physicalDescription:
            form.physicalDescription,

          personality:
            form.personality,

          psychologicalProfile:
            form.psychologicalProfile,

          goals: form.goals,

          motivations:
            form.motivations,

          background:
            form.background,

          notes: form.notes,
        });

      if (
        createdCharacter !== null
      ) {
        const nextForm =
          characterToForm(
            createdCharacter,
          );

        setSelectedCharacterId(
          createdCharacter.id,
        );

        setForm(nextForm);
        setSavedForm(nextForm);
      }

      return;
    }

    const updatedCharacter =
      await updateCharacter(
        selectedCharacter.id,
        formToUpdateInput(form),
      );

    if (
      updatedCharacter !== null
    ) {
      const nextForm =
        characterToForm(
          updatedCharacter,
        );

      setForm(nextForm);
      setSavedForm(nextForm);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    await saveCurrentCharacter();
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
      selectedCharacter === null
    ) {
      return;
    }

    if (
      isDirty &&
      !window.confirm(
        "ستُفقد التغييرات غير المحفوظة قبل حذف الشخصية.\n\nهل تريد المتابعة؟",
      )
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `هل تريد حذف شخصية «${selectedCharacter.name}»؟\n\nلن يمكن التراجع عن هذا الإجراء.`,
      );

    if (!confirmed) {
      return;
    }

    const deleted =
      await deleteCharacter(
        selectedCharacter.id,
      );

    if (deleted) {
      setSelectedCharacterId(
        null,
      );

      const nextForm = {
        ...emptyForm,
      };

      setForm(nextForm);
      setSavedForm(nextForm);
    }
  }

  return (
    <main
      className="characters-workspace"
      dir="rtl"
    >
      <header className="characters-header">
        <div>
          <span className="characters-kicker">
            {project.title}
          </span>

          <h1>الشخصيات</h1>

          <p>
            إنشاء شخصيات العمل وتحديد
            وظائفها وملامحها ودوافعها.
          </p>
        </div>

        <button
          type="button"
          className="characters-primary-button"
          onClick={
            startNewCharacter
          }
        >
          شخصية جديدة
        </button>
      </header>

      {error !== null && (
        <div
          className="characters-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="characters-layout">
        <aside className="characters-list-panel">
          <div className="characters-list-heading">
            <strong>
              شخصيات المشروع
            </strong>

            <span>
              {visibleCharacters.length}
              {visibleCharacters.length !==
                characters.length &&
                ` / ${characters.length}`}
            </span>
          </div>

          <div className="characters-list-tools">
            <input
              type="search"
              value={searchQuery}
              placeholder="البحث عن شخصية..."
              aria-label="البحث عن شخصية"
              onChange={(event) => {
                setSearchQuery(
                  event.target.value,
                );
              }}
            />

            <select
              value={roleFilter}
              aria-label="تصفية حسب الوظيفة الدرامية"
              onChange={(event) => {
                setRoleFilter(
                  event.target
                    .value as CharacterRoleFilter,
                );
              }}
            >
              <option value="all">
                جميع الوظائف
              </option>

              <option value="main">
                رئيسية
              </option>

              <option value="supporting">
                مساندة
              </option>

              <option value="secondary">
                ثانوية
              </option>

              <option value="minor">
                محدودة
              </option>

              <option value="extra">
                إضافية
              </option>

              <option value="unspecified">
                غير محددة
              </option>
            </select>
          </div>

          {isLoading ? (
            <div className="characters-list-state">
              جارٍ تحميل الشخصيات...
            </div>
          ) : characters.length === 0 ? (
            <div className="characters-list-state">
              لم تُنشأ أي شخصية بعد.
            </div>
          ) : visibleCharacters.length ===
            0 ? (
            <div className="characters-list-state">
              لا توجد شخصية مطابقة
              للبحث أو التصفية.
            </div>
          ) : (
            <div className="characters-list">
              {visibleCharacters.map(
                (character) => (
                  <button
                    key={character.id}
                    type="button"
                    className={
                      character.id ===
                      selectedCharacterId
                        ? "character-list-item is-active"
                        : "character-list-item"
                    }
                    onClick={() => {
                      selectCharacter(
                        character.id,
                      );
                    }}
                  >
                    <span className="character-list-avatar">
                      {getInitial(
                        character.name,
                      )}
                    </span>

                    <span className="character-list-copy">
                      <strong>
                        {character.name}
                      </strong>

                      <small>
                        {getRoleLabel(
                          character.role,
                        )}

                        {character.age
                          ? ` · ${character.age}`
                          : ""}
                      </small>
                    </span>
                  </button>
                ),
              )}
            </div>
          )}
        </aside>

        <section className="character-editor-panel">
          <div className="character-editor-heading">
            <div>
              <span>
                {selectedCharacter === null
                  ? "إضافة شخصية"
                  : "تحرير الشخصية"}
              </span>

              <h2>
                {selectedCharacter?.name ??
                  "شخصية جديدة"}
              </h2>
            </div>

            <div className="character-editor-status">
              <span
                className={
                  isDirty
                    ? "character-save-status is-dirty"
                    : "character-save-status"
                }
              >
                {isSaving
                  ? "جارٍ الحفظ..."
                  : isDirty
                    ? "تغييرات غير محفوظة"
                    : selectedCharacter ===
                        null
                      ? "نموذج جديد"
                      : "جميع التغييرات محفوظة"}
              </span>

              {selectedCharacter !== null && (
                <button
                  type="button"
                  className="characters-danger-button"
                  disabled={isSaving}
                  onClick={() => {
                    void handleDelete();
                  }}
                >
                  حذف الشخصية
                </button>
              )}
            </div>
          </div>

          <form
            className="character-form"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <CharacterInput
              label="اسم الشخصية"
              value={form.name}
              required
              placeholder="الاسم الكامل أو الاسم المتداول"
              onChange={(value) => {
                updateForm({
                  name: value,
                });
              }}
            />

            <CharacterInput
              label="الاسم المختصر"
              value={form.shortName}
              placeholder="الاسم المستخدم في الحوار"
              onChange={(value) => {
                updateForm({
                  shortName: value,
                });
              }}
            />

            <label className="character-form-field">
              <span>الجنس</span>

              <select
                value={form.gender}
                onChange={(event) => {
                  updateForm({
                    gender:
                      event.target
                        .value as CharacterGender,
                  });
                }}
              >
                <option value="unspecified">
                  غير محدد
                </option>

                <option value="male">
                  ذكر
                </option>

                <option value="female">
                  أنثى
                </option>

                <option value="other">
                  آخر
                </option>
              </select>
            </label>

            <CharacterInput
              label="العمر"
              value={form.age}
              placeholder="مثال: 45 سنة"
              onChange={(value) => {
                updateForm({
                  age: value,
                });
              }}
            />

            <label className="character-form-field">
              <span>الوظيفة الدرامية</span>

              <select
                value={form.role}
                onChange={(event) => {
                  updateForm({
                    role:
                      event.target
                        .value as CharacterRole,
                  });
                }}
              >
                <option value="unspecified">
                  غير محددة
                </option>

                <option value="main">
                  رئيسية
                </option>

                <option value="supporting">
                  مساندة
                </option>

                <option value="secondary">
                  ثانوية
                </option>

                <option value="minor">
                  محدودة
                </option>

                <option value="extra">
                  إضافية
                </option>
              </select>
            </label>

            <CharacterTextarea
              label="الوصف الجسدي"
              value={
                form.physicalDescription
              }
              onChange={(value) => {
                updateForm({
                  physicalDescription:
                    value,
                });
              }}
            />

            <CharacterTextarea
              label="الملامح والطباع"
              value={form.personality}
              onChange={(value) => {
                updateForm({
                  personality: value,
                });
              }}
            />

            <CharacterTextarea
              label="الملف النفسي"
              value={
                form.psychologicalProfile
              }
              onChange={(value) => {
                updateForm({
                  psychologicalProfile:
                    value,
                });
              }}
            />

            <CharacterTextarea
              label="الأهداف"
              value={form.goals}
              onChange={(value) => {
                updateForm({
                  goals: value,
                });
              }}
            />

            <CharacterTextarea
              label="الدوافع"
              value={form.motivations}
              onChange={(value) => {
                updateForm({
                  motivations:
                    value,
                });
              }}
            />

            <CharacterTextarea
              label="الخلفية"
              value={form.background}
              fullWidth
              onChange={(value) => {
                updateForm({
                  background: value,
                });
              }}
            />

            <CharacterTextarea
              label="ملاحظات"
              value={form.notes}
              fullWidth
              onChange={(value) => {
                updateForm({
                  notes: value,
                });
              }}
            />

            <div className="character-form-actions">
              <button
                type="button"
                className="characters-secondary-button"
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
                className="characters-primary-button"
                disabled={
                  isSaving ||
                  !isDirty ||
                  !form.name.trim()
                }
                title="حفظ الشخصية — Ctrl + S"
              >
                {isSaving
                  ? "جارٍ الحفظ..."
                  : selectedCharacter ===
                      null
                    ? "إنشاء الشخصية"
                    : "حفظ التعديلات"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

interface CharacterInputProps {
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  onChange: (
    value: string,
  ) => void;
}

function CharacterInput({
  label,
  value,
  placeholder,
  required = false,
  onChange,
}: CharacterInputProps) {
  return (
    <label className="character-form-field">
      <span>{label}</span>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(event) => {
          onChange(
            event.target.value,
          );
        }}
      />
    </label>
  );
}

interface CharacterTextareaProps {
  label: string;
  value: string;
  fullWidth?: boolean;
  onChange: (
    value: string,
  ) => void;
}

function CharacterTextarea({
  label,
  value,
  fullWidth = false,
  onChange,
}: CharacterTextareaProps) {
  return (
    <label
      className={
        fullWidth
          ? "character-form-field character-form-field--full"
          : "character-form-field"
      }
    >
      <span>{label}</span>

      <textarea
        rows={5}
        value={value}
        onChange={(event) => {
          onChange(
            event.target.value,
          );
        }}
      />
    </label>
  );
}

function characterToForm(
  character: Character,
): CharacterFormState {
  return {
    name: character.name,

    shortName:
      character.shortName ?? "",

    gender: character.gender,
    age: character.age ?? "",
    role: character.role,

    physicalDescription:
      character.physicalDescription ??
      "",

    personality:
      character.personality ?? "",

    psychologicalProfile:
      character.psychologicalProfile ??
      "",

    goals:
      character.goals ?? "",

    motivations:
      character.motivations ?? "",

    background:
      character.background ?? "",

    notes:
      character.notes ?? "",
  };
}

function formToUpdateInput(
  form: CharacterFormState,
): UpdateCharacterInput {
  return {
    name: form.name,

    shortName:
      form.shortName || null,

    gender: form.gender,

    age:
      form.age || null,

    role: form.role,

    physicalDescription:
      form.physicalDescription ||
      null,

    personality:
      form.personality || null,

    psychologicalProfile:
      form.psychologicalProfile ||
      null,

    goals:
      form.goals || null,

    motivations:
      form.motivations || null,

    background:
      form.background || null,

    notes:
      form.notes || null,
  };
}

function areFormsEqual(
  firstForm: CharacterFormState,
  secondForm: CharacterFormState,
): boolean {
  return (
    JSON.stringify(firstForm) ===
    JSON.stringify(secondForm)
  );
}

function getInitial(
  name: string,
): string {
  const normalizedName =
    name.trim();

  return normalizedName
    ? normalizedName.charAt(0)
    : "ش";
}

function getRoleLabel(
  role: CharacterRole,
): string {
  switch (role) {
    case "main":
      return "رئيسية";

    case "supporting":
      return "مساندة";

    case "secondary":
      return "ثانوية";

    case "minor":
      return "محدودة";

    case "extra":
      return "إضافية";

    case "unspecified":
      return "غير محددة";
  }
}