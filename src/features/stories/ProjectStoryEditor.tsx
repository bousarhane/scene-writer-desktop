import type {
  Project,
  ProjectStoryContent,
} from "../../types";

import {
  useProjectStory,
} from "./useProjectStory";

import "./project-story.css";

interface ProjectStoryEditorProps {
  project: Project;
}

export function ProjectStoryEditor({
  project,
}: ProjectStoryEditorProps) {
  const {
    content,
    isLoading,
    isSaving,
    isDirty,
    error,
    updateContent,
    saveStory,
    restoreSavedContent,
  } = useProjectStory(project.id);

  if (isLoading) {
    return (
      <main className="story-editor-state">
        جارٍ تحميل الحكاية...
      </main>
    );
  }

  function updateField(
    field: keyof ProjectStoryContent,
    value: string,
  ): void {
    updateContent({
      ...content,
      [field]: value,
    });
  }

  return (
    <main
      className="story-editor"
      dir="rtl"
    >
      <header className="story-editor-header">
        <div>
          <span className="story-editor-kicker">
            {project.title}
          </span>

          <h1>الحكاية</h1>

          <p>
            بناء الأساس الحكائي والفكري
            الذي سينطلق منه العمل الدرامي.
          </p>
        </div>

        <div className="story-editor-header-actions">
          <span
            className={
              isDirty
                ? "story-save-status is-dirty"
                : "story-save-status"
            }
          >
            {isDirty
              ? "توجد تغييرات غير محفوظة"
              : "جميع التغييرات محفوظة"}
          </span>

          <button
            type="button"
            className="story-secondary-button"
            disabled={
              !isDirty || isSaving
            }
            onClick={restoreSavedContent}
          >
            التراجع عن التغييرات
          </button>

          <button
            type="button"
            className="story-primary-button"
            disabled={
              !isDirty || isSaving
            }
            onClick={() => {
              void saveStory();
            }}
          >
            {isSaving
              ? "جارٍ الحفظ..."
              : "حفظ الحكاية"}
          </button>
        </div>
      </header>

      {error !== null && (
        <div
          className="story-editor-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <section className="story-editor-grid">
        <StoryField
          title="الفكرة الأساسية"
          description="الفكرة الجوهرية التي يقوم عليها العمل، قبل تحويلها إلى أحداث وشخصيات."
          value={content.premise}
          placeholder="ما الفكرة التي ينطلق منها هذا العمل؟"
          rows={4}
          onChange={(value) => {
            updateField(
              "premise",
              value,
            );
          }}
        />

        <StoryField
          title="الجملة التعريفية"
          description="صياغة مكثفة توضّح الشخصية المحورية وهدفها والعائق الذي تواجهه."
          value={content.logline}
          placeholder="اكتب الحكاية في جملة درامية مركزة..."
          rows={4}
          onChange={(value) => {
            updateField(
              "logline",
              value,
            );
          }}
        />

        <StoryField
          title="الملخص العام"
          description="السرد العام للحكاية، من نقطة البداية إلى اتجاهها النهائي."
          value={content.synopsis}
          placeholder="اكتب الملخص العام للعمل..."
          rows={10}
          fullWidth
          onChange={(value) => {
            updateField(
              "synopsis",
              value,
            );
          }}
        />

        <StoryField
          title="الموضوعات والقضايا"
          description="القضايا والأسئلة الإنسانية أو الاجتماعية التي يعالجها العمل."
          value={content.themes}
          placeholder="مثال: السلطة، العائلة، الميراث، الخيانة..."
          rows={5}
          onChange={(value) => {
            updateField(
              "themes",
              value,
            );
          }}
        />

        <StoryField
          title="الصراع المركزي"
          description="القوة الأساسية التي تحرك الحكاية وتضع الشخصيات في مواجهة مستمرة."
          value={content.centralConflict}
          placeholder="ما جوهر الصراع في هذا العمل؟"
          rows={5}
          onChange={(value) => {
            updateField(
              "centralConflict",
              value,
            );
          }}
        />

        <StoryField
          title="نقطة الانطلاق"
          description="الوضع الأول الذي تبدأ منه الحكاية والحدث الذي يخلخل توازن الشخصيات."
          value={content.startingPoint}
          placeholder="كيف تبدأ الحكاية؟ وما الحدث الذي يطلقها؟"
          rows={6}
          onChange={(value) => {
            updateField(
              "startingPoint",
              value,
            );
          }}
        />

        <StoryField
          title="الاتجاه أو النهاية المتوقعة"
          description="الاتجاه الذي تمضي إليه الحكاية، حتى إن لم تكن النهاية محسومة نهائيًا."
          value={
            content.expectedDirection
          }
          placeholder="إلى أين تتجه الحكاية؟"
          rows={6}
          onChange={(value) => {
            updateField(
              "expectedDirection",
              value,
            );
          }}
        />

        <StoryField
          title="ملاحظات الكاتب"
          description="مساحة حرة للأفكار والاحتمالات والملاحظات المرتبطة بتطوير الحكاية."
          value={content.writerNotes}
          placeholder="أضف ملاحظاتك وأفكارك..."
          rows={7}
          fullWidth
          onChange={(value) => {
            updateField(
              "writerNotes",
              value,
            );
          }}
        />
      </section>

      <footer className="story-editor-footer">
        <span>
          {isDirty
            ? "لم تُحفظ آخر التغييرات بعد."
            : "الحكاية محفوظة في قاعدة البيانات المحلية."}
        </span>

        <button
          type="button"
          className="story-primary-button"
          disabled={
            !isDirty || isSaving
          }
          onClick={() => {
            void saveStory();
          }}
        >
          {isSaving
            ? "جارٍ الحفظ..."
            : "حفظ الحكاية"}
        </button>
      </footer>
    </main>
  );
}

interface StoryFieldProps {
  title: string;
  description: string;
  value: string;
  placeholder: string;
  rows: number;
  fullWidth?: boolean;
  onChange: (value: string) => void;
}

function StoryField({
  title,
  description,
  value,
  placeholder,
  rows,
  fullWidth = false,
  onChange,
}: StoryFieldProps) {
  return (
    <label
      className={
        fullWidth
          ? "story-field story-field--full"
          : "story-field"
      }
    >
      <span className="story-field-heading">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>

      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </label>
  );
}