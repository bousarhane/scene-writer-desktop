import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import type {
  Character,
  CharacterRelation,
  CharacterRelationType,
} from "../../types";

import {
  useCharacterRelations,
} from "./useCharacterRelations";

import "./character-relations.css";

interface CharacterRelationsPanelProps {
  projectId: string;
  character: Character;
  characters: Character[];
}

interface RelationFormState {
  targetCharacterId: string;

  relationType:
    CharacterRelationType;

  customLabel: string;
  description: string;
}

const emptyRelationForm:
  RelationFormState = {
    targetCharacterId: "",

    relationType: "relative",

    customLabel: "",
    description: "",
  };

export function CharacterRelationsPanel({
  projectId,
  character,
  characters,
}: CharacterRelationsPanelProps) {
  const {
    relations,

    isLoadingRelations,
    isSavingRelation,
    relationError,

    createRelation,
    updateRelation,
    deleteRelation,

    clearRelationError,
  } = useCharacterRelations(
    projectId,
    character.id,
  );

  const [
    selectedRelationId,
    setSelectedRelationId,
  ] = useState<string | null>(
    null,
  );

  const [
    form,
    setForm,
  ] = useState<RelationFormState>({
    ...emptyRelationForm,
  });

  const availableCharacters =
    characters.filter(
      (candidate) =>
        candidate.id !==
        character.id,
    );

  const selectedRelation =
    relations.find(
      (relation) =>
        relation.id ===
        selectedRelationId,
    ) ?? null;

  useEffect(() => {
    setSelectedRelationId(null);

    setForm({
      ...emptyRelationForm,
    });
  }, [character.id]);

  function startNewRelation(): void {
    clearRelationError();

    setSelectedRelationId(null);

    setForm({
      ...emptyRelationForm,
    });
  }

  function editRelation(
    relation: CharacterRelation,
  ): void {
    clearRelationError();

    const relatedCharacterId =
      getRelatedCharacterId(
        relation,
        character.id,
      );

    setSelectedRelationId(
      relation.id,
    );

    setForm({
      targetCharacterId:
        relatedCharacterId,

      relationType:
        relation.relationType,

      customLabel:
        relation.customLabel ?? "",

      description:
        relation.description ?? "",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!form.targetCharacterId) {
      return;
    }

    if (selectedRelation === null) {
      const createdRelation =
        await createRelation({
          targetCharacterId:
            form.targetCharacterId,

          relationType:
            form.relationType,

          customLabel:
            form.customLabel,

          description:
            form.description,
        });

      if (createdRelation !== null) {
        startNewRelation();
      }

      return;
    }

    const updatedRelation =
      await updateRelation(
        selectedRelation.id,
        {
          targetCharacterId:
            form.targetCharacterId,

          relationType:
            form.relationType,

          customLabel:
            form.customLabel ||
            null,

          description:
            form.description ||
            null,
        },
      );

    if (updatedRelation !== null) {
      startNewRelation();
    }
  }

  async function handleDelete(
    relation: CharacterRelation,
  ): Promise<void> {
    const relatedCharacterId =
      getRelatedCharacterId(
        relation,
        character.id,
      );

    const relatedCharacter =
      characters.find(
        (candidate) =>
          candidate.id ===
          relatedCharacterId,
      );

    const confirmed =
      window.confirm(
        `هل تريد حذف العلاقة مع «${relatedCharacter?.name ?? "الشخصية"}»؟`,
      );

    if (!confirmed) {
      return;
    }

    const deleted =
      await deleteRelation(
        relation.id,
      );

    if (
      deleted &&
      selectedRelationId ===
        relation.id
    ) {
      startNewRelation();
    }
  }

  if (
    availableCharacters.length === 0
  ) {
    return (
      <section className="character-relations-panel">
        <div className="character-relations-heading">
          <div>
            <span>شبكة الشخصيات</span>
            <h3>العلاقات</h3>
          </div>
        </div>

        <div className="character-relations-empty">
          أنشئ شخصية أخرى على الأقل
          لإضافة علاقة.
        </div>
      </section>
    );
  }

  return (
    <section className="character-relations-panel">
      <div className="character-relations-heading">
        <div>
          <span>شبكة الشخصيات</span>
          <h3>العلاقات</h3>
        </div>

        <button
          type="button"
          className="characters-secondary-button"
          onClick={startNewRelation}
        >
          علاقة جديدة
        </button>
      </div>

      {relationError !== null && (
        <div
          className="characters-error"
          role="alert"
        >
          {relationError}
        </div>
      )}

      <div className="character-relations-layout">
        <div className="character-relations-list">
          {isLoadingRelations ? (
            <div className="character-relations-empty">
              جارٍ تحميل العلاقات...
            </div>
          ) : relations.length === 0 ? (
            <div className="character-relations-empty">
              لا توجد علاقات مسجلة
              لهذه الشخصية.
            </div>
          ) : (
            relations.map((relation) => {
              const relatedCharacterId =
                getRelatedCharacterId(
                  relation,
                  character.id,
                );

              const relatedCharacter =
                characters.find(
                  (candidate) =>
                    candidate.id ===
                    relatedCharacterId,
                );

              return (
                <article
                  key={relation.id}
                  className={
                    relation.id ===
                    selectedRelationId
                      ? "character-relation-card is-active"
                      : "character-relation-card"
                  }
                >
                  <button
                    type="button"
                    className="character-relation-main"
                    onClick={() => {
                      editRelation(
                        relation,
                      );
                    }}
                  >
                    <strong>
                      {relatedCharacter?.name ??
                        "شخصية محذوفة"}
                    </strong>

                    <span>
                      {getRelationLabel(
                        relation,
                      )}
                    </span>

                    {relation.description && (
                      <small>
                        {
                          relation.description
                        }
                      </small>
                    )}
                  </button>

                  <button
                    type="button"
                    className="character-relation-delete"
                    aria-label="حذف العلاقة"
                    disabled={
                      isSavingRelation
                    }
                    onClick={() => {
                      void handleDelete(
                        relation,
                      );
                    }}
                  >
                    حذف
                  </button>
                </article>
              );
            })
          )}
        </div>

        <form
          className="character-relation-form"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <label>
            <span>الشخصية المرتبطة</span>

            <select
              value={
                form.targetCharacterId
              }
              required
              onChange={(event) => {
                setForm({
                  ...form,

                  targetCharacterId:
                    event.target.value,
                });
              }}
            >
              <option value="">
                اختر شخصية
              </option>

              {availableCharacters.map(
                (candidate) => (
                  <option
                    key={candidate.id}
                    value={candidate.id}
                  >
                    {candidate.name}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span>نوع العلاقة</span>

            <select
              value={form.relationType}
              onChange={(event) => {
                setForm({
                  ...form,

                  relationType:
                    event.target
                      .value as CharacterRelationType,
                });
              }}
            >
              <option value="parent">
                أب أو أم
              </option>

              <option value="child">
                ابن أو ابنة
              </option>

              <option value="spouse">
                زوج أو زوجة
              </option>

              <option value="sibling">
                أخ أو أخت
              </option>

              <option value="friend">
                صديق
              </option>

              <option value="enemy">
                خصم
              </option>

              <option value="colleague">
                زميل
              </option>

              <option value="relative">
                قريب
              </option>

              <option value="custom">
                علاقة خاصة
              </option>
            </select>
          </label>

          {form.relationType ===
            "custom" && (
            <label>
              <span>
                تسمية العلاقة
              </span>

              <input
                type="text"
                required
                value={
                  form.customLabel
                }
                placeholder="مثال: وصي، معلم، شريك..."
                onChange={(event) => {
                  setForm({
                    ...form,

                    customLabel:
                      event.target.value,
                  });
                }}
              />
            </label>
          )}

          <label className="character-relation-description">
            <span>وصف العلاقة</span>

            <textarea
              rows={4}
              value={form.description}
              placeholder="طبيعة العلاقة وتاريخها وتوتراتها..."
              onChange={(event) => {
                setForm({
                  ...form,

                  description:
                    event.target.value,
                });
              }}
            />
          </label>

          <div className="character-relation-actions">
            <button
              type="button"
              className="characters-secondary-button"
              disabled={
                isSavingRelation
              }
              onClick={startNewRelation}
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="characters-primary-button"
              disabled={
                isSavingRelation ||
                !form.targetCharacterId ||
                (
                  form.relationType ===
                    "custom" &&
                  !form.customLabel.trim()
                )
              }
            >
              {isSavingRelation
                ? "جارٍ الحفظ..."
                : selectedRelation ===
                    null
                  ? "إضافة العلاقة"
                  : "حفظ العلاقة"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function getRelatedCharacterId(
  relation: CharacterRelation,
  currentCharacterId: string,
): string {
  return relation.sourceCharacterId ===
    currentCharacterId
    ? relation.targetCharacterId
    : relation.sourceCharacterId;
}

function getRelationLabel(
  relation: CharacterRelation,
): string {
  if (
    relation.relationType ===
    "custom"
  ) {
    return (
      relation.customLabel ??
      "علاقة خاصة"
    );
  }

  switch (relation.relationType) {
    case "parent":
      return "أب أو أم";

    case "child":
      return "ابن أو ابنة";

    case "spouse":
      return "زوج أو زوجة";

    case "sibling":
      return "أخ أو أخت";

    case "friend":
      return "صديق";

    case "enemy":
      return "خصم";

    case "colleague":
      return "زميل";

    case "relative":
      return "قريب";
  }
}