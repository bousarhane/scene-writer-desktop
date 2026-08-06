import type {
  Episode,
  Project,
  Scene,
  SceneElement,
} from "../../types";

export interface ScreenplayPdfCoverOptions {
  showCover: boolean;
  title: string;
  subtitle: string;
  authorName: string;
  creditLabel: string;
  presentedTo: string;
  contact: string;
}

export interface ScreenplayPdfExportInput {
  project: Project;
  episode: Episode | null;
  scenes: Scene[];
  elementsByScene: Record<string, SceneElement[]>;
  cover?: ScreenplayPdfCoverOptions;
}

export async function exportScreenplayToPdf(
  input: ScreenplayPdfExportInput,
): Promise<void> {
  if (input.scenes.length === 0) {
    throw new Error("لا توجد مشاهد قابلة للتصدير.");
  }

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.width = "1px";
  frame.style.height = "1px";
  frame.style.left = "-10000px";
  frame.style.top = "0";
  frame.style.border = "0";
  frame.style.opacity = "0";
  frame.style.pointerEvents = "none";
  document.body.appendChild(frame);

  const exportWindow = frame.contentWindow;
  const exportDocument = frame.contentDocument;

  if (!exportWindow || !exportDocument) {
    frame.remove();
    throw new Error("تعذر فتح نافذة تجهيز ملف PDF.");
  }

  const cover = normalizeCoverOptions(input);
  const title = cover.title || input.project.title.trim() || "سيناريو";
  const episodeLabel = input.episode
    ? `الحلقة ${input.episode.number}${input.episode.title ? ` - ${input.episode.title}` : ""}`
    : null;
  const fileTitle = sanitizeDocumentTitle(
    episodeLabel ? `${title} - ${episodeLabel}` : title,
  );

  exportDocument.open();
  exportDocument.write(
    buildExportDocument({
      ...input,
      title,
      episodeLabel,
      fileTitle,
      cover,
    }),
  );
  exportDocument.close();

  await waitForDocumentReady(exportDocument);
  paginateDocument(exportDocument);

  const previousTitle = document.title;
  document.title = fileTitle;
  exportDocument.title = fileTitle;

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 200);
  });

  const cleanup = (): void => {
    document.title = previousTitle;
    window.setTimeout(() => frame.remove(), 500);
  };

  exportWindow.addEventListener("afterprint", cleanup, { once: true });

  try {
    exportWindow.focus();
    exportWindow.print();

    window.setTimeout(() => {
      if (document.body.contains(frame)) {
        cleanup();
      }
    }, 60000);
  } catch (error) {
    cleanup();
    throw error;
  }
}

interface ExportDocumentInput extends ScreenplayPdfExportInput {
  title: string;
  episodeLabel: string | null;
  fileTitle: string;
  cover: ScreenplayPdfCoverOptions;
}

function buildExportDocument(input: ExportDocumentInput): string {
  const sourceMarkup = input.scenes
    .map((scene) => renderScene(scene, input.elementsByScene[scene.id] ?? []))
    .join("");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.fileTitle)}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      color: #111;
      background: #fff;
      font-family: "Segoe UI", Tahoma, Arial, sans-serif;
      direction: rtl;
    }

    body {
      font-size: 12pt;
      line-height: 1.7;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    .pdf-cover,
    .pdf-page {
      position: relative;
      width: 210mm;
      height: 297mm;
      overflow: hidden;
      background: #fff;
      break-after: page;
      page-break-after: always;
    }

    .pdf-cover {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 22mm;
      text-align: center;
    }

    .pdf-cover__label {
      margin-bottom: 12mm;
      color: #6b5848;
      font-size: 11pt;
      font-weight: 700;
    }

    .pdf-cover h1 {
      max-width: 150mm;
      margin: 0;
      font-size: 28pt;
      line-height: 1.45;
    }

    .pdf-cover h2 {
      max-width: 150mm;
      margin: 8mm 0 0;
      color: #4f4f4f;
      font-size: 17pt;
      line-height: 1.5;
    }

    .pdf-cover__subtitle {
      max-width: 150mm;
      margin: 5mm 0 0;
      color: #555;
      font-size: 15pt;
      line-height: 1.55;
    }

    .pdf-cover__episode {
      max-width: 150mm;
      margin: 7mm 0 0;
      color: #4f4f4f;
      font-size: 16pt;
      font-weight: 700;
      line-height: 1.5;
    }

    .pdf-cover__type {
      margin-top: 13mm;
      color: #777;
      font-size: 10.5pt;
    }

    .pdf-cover__credits {
      display: grid;
      gap: 1.5mm;
      margin-top: 22mm;
      text-align: center;
    }

    .pdf-cover__credits small,
    .pdf-cover__submission small {
      color: #777;
      font-size: 9pt;
    }

    .pdf-cover__credits strong {
      font-size: 13pt;
      font-weight: 800;
    }

    .pdf-cover__submission {
      position: absolute;
      right: 22mm;
      bottom: 18mm;
      left: 22mm;
      display: grid;
      gap: 1.2mm;
      color: #555;
      font-size: 9.5pt;
      line-height: 1.55;
      text-align: center;
      white-space: pre-wrap;
    }

    .pdf-page__content {
      height: 100%;
      padding: 16mm 20mm 19mm;
      overflow: hidden;
    }

    .pdf-page__number {
      position: absolute;
      right: 0;
      bottom: 6mm;
      left: 0;
      color: #555;
      font-size: 9.5pt;
      line-height: 1;
      text-align: center;
    }

    .pdf-source {
      position: absolute;
      width: 170mm;
      visibility: hidden;
      pointer-events: none;
    }

    .pdf-block {
      display: block;
      width: 100%;
    }

    .pdf-scene-heading {
      margin: 0 0 5mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .pdf-scene-number {
      display: block;
      margin-bottom: 1mm;
      color: #6b5848;
      font-size: 9.5pt;
      font-weight: 700;
    }

    .pdf-scene-heading h2 {
      margin: 0;
      font-size: 13.5pt;
      font-weight: 800;
      line-height: 1.55;
    }

    .pdf-element {
      margin: 0 0 3mm;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .pdf-element--action,
    .pdf-element--shot {
      text-align: right;
    }

    .pdf-dialogue-group {
      margin: 5mm 0 3mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .pdf-dialogue-group .pdf-element--character {
      width: 54%;
      margin: 0 auto 1mm;
      text-align: center;
      font-weight: 800;
    }

    .pdf-dialogue-group .pdf-element--parenthetical {
      width: 58%;
      margin: 0 auto 1mm;
      text-align: center;
      font-style: italic;
    }

    .pdf-dialogue-group .pdf-element--dialogue {
      width: 70%;
      margin-right: auto;
      margin-left: auto;
      text-align: right;
    }

    .pdf-element--transition {
      margin-top: 5mm;
      text-align: left;
      font-weight: 700;
    }

    .pdf-element--centered_text {
      text-align: center;
    }

    .pdf-element--note {
      padding: 3mm 4mm;
      border-right: 2px solid #a7896e;
      color: #54483e;
      background: #f6f2ed;
      font-size: 10.5pt;
    }

    @media screen {
      body {
        background: #e9e9e9;
      }

      .pdf-cover,
      .pdf-page {
        margin: 8mm auto;
        box-shadow: 0 5px 24px rgba(0, 0, 0, 0.12);
      }
    }

    @media print {
      body {
        background: #fff;
      }

      .pdf-cover,
      .pdf-page {
        margin: 0;
        box-shadow: none;
      }

      .pdf-source {
        display: none;
      }
    }
  </style>
</head>
<body>
  ${input.cover.showCover ? renderCover(input) : ""}

  <main id="pdf-pages"></main>
  <div id="pdf-source" class="pdf-source">${sourceMarkup}</div>
</body>
</html>`;
}

function normalizeCoverOptions(
  input: ScreenplayPdfExportInput,
): ScreenplayPdfCoverOptions {
  return {
    showCover: input.cover?.showCover ?? true,
    title:
      input.cover?.title.trim() ||
      input.project.title.trim() ||
      "سيناريو",
    subtitle:
      input.cover?.subtitle.trim() ||
      input.project.subtitle?.trim() ||
      "",
    authorName:
      input.cover?.authorName.trim() ||
      input.project.authorName?.trim() ||
      "",
    creditLabel:
      input.cover?.creditLabel.trim() ||
      "سيناريو وحوار",
    presentedTo:
      input.cover?.presentedTo.trim() ||
      "",
    contact:
      input.cover?.contact.trim() ||
      "",
  };
}

function renderCover(input: ExportDocumentInput): string {
  const subtitle = input.cover.subtitle
    ? `<div class="pdf-cover__subtitle">${escapeHtml(input.cover.subtitle)}</div>`
    : "";
  const episode = input.episodeLabel
    ? `<div class="pdf-cover__episode">${escapeHtml(input.episodeLabel)}</div>`
    : "";
  const credits = input.cover.authorName
    ? `<div class="pdf-cover__credits">
        <small>${escapeHtml(input.cover.creditLabel)}</small>
        <strong>${escapeHtml(input.cover.authorName)}</strong>
      </div>`
    : "";
  const submissionParts = [
    input.cover.presentedTo
      ? `<div><small>مقدَّم إلى</small><br />${escapeHtml(input.cover.presentedTo)}</div>`
      : "",
    input.cover.contact
      ? `<div>${escapeHtml(input.cover.contact)}</div>`
      : "",
  ].filter(Boolean);
  const submission = submissionParts.length > 0
    ? `<div class="pdf-cover__submission">${submissionParts.join("")}</div>`
    : "";

  return `<section class="pdf-cover">
    <div class="pdf-cover__label">سيناريو</div>
    <h1>${escapeHtml(input.title)}</h1>
    ${subtitle}
    ${episode}
    <div class="pdf-cover__type">${escapeHtml(getProjectTypeLabel(input.project.projectType))}</div>
    ${credits}
    ${submission}
  </section>`;
}

function renderScene(
  scene: Scene,
  rawElements: SceneElement[],
): string {
  const elements = [...rawElements].sort(
    (first, second) => first.orderIndex - second.orderIndex,
  );

  const blocks: string[] = [
    `<header class="pdf-block pdf-scene-heading">
      <span class="pdf-scene-number">المشهد ${escapeHtml(scene.sceneNumber)}</span>
      <h2>${escapeHtml(scene.heading || scene.title || `المشهد ${scene.sceneNumber}`)}</h2>
    </header>`,
  ];

  let index = 0;

  while (index < elements.length) {
    const element = elements[index];

    if (element.type === "character") {
      const grouped: SceneElement[] = [element];
      let nextIndex = index + 1;

      while (
        nextIndex < elements.length &&
        (elements[nextIndex].type === "parenthetical" ||
          elements[nextIndex].type === "dialogue")
      ) {
        grouped.push(elements[nextIndex]);
        nextIndex += 1;
      }

      blocks.push(
        `<section class="pdf-block pdf-dialogue-group">${grouped
          .map(renderElement)
          .join("")}</section>`,
      );

      index = nextIndex;
      continue;
    }

    const rendered = renderElement(element);
    if (rendered) {
      blocks.push(`<div class="pdf-block">${rendered}</div>`);
    }

    index += 1;
  }

  return blocks.join("");
}

function paginateDocument(documentToPrint: Document): void {
  const source = documentToPrint.getElementById("pdf-source");
  const pagesRoot = documentToPrint.getElementById("pdf-pages");

  if (!source || !pagesRoot) {
    throw new Error("تعذر بناء صفحات التصدير.");
  }

  const blocks = Array.from(source.children).map((node) =>
    node.cloneNode(true) as HTMLElement,
  );

  let pageNumber = 1;
  let currentPage = createPage(documentToPrint, pageNumber);
  let currentContent = currentPage.querySelector<HTMLElement>(
    ".pdf-page__content",
  );

  if (!currentContent) {
    throw new Error("تعذر إنشاء محتوى صفحة التصدير.");
  }

  pagesRoot.appendChild(currentPage);

  for (const block of blocks) {
    currentContent.appendChild(block);

    if (currentContent.scrollHeight <= currentContent.clientHeight + 1) {
      continue;
    }

    currentContent.removeChild(block);

    if (currentContent.children.length === 0) {
      currentContent.appendChild(block);
      continue;
    }

    pageNumber += 1;
    currentPage = createPage(documentToPrint, pageNumber);
    pagesRoot.appendChild(currentPage);

    const nextContent = currentPage.querySelector<HTMLElement>(
      ".pdf-page__content",
    );

    if (!nextContent) {
      throw new Error("تعذر إنشاء الصفحة التالية.");
    }

    currentContent = nextContent;
    currentContent.appendChild(block);
  }

  source.remove();
}

function createPage(
  documentToPrint: Document,
  pageNumber: number,
): HTMLElement {
  const page = documentToPrint.createElement("section");
  page.className = "pdf-page";

  const content = documentToPrint.createElement("div");
  content.className = "pdf-page__content";

  const number = documentToPrint.createElement("div");
  number.className = "pdf-page__number";
  number.textContent = String(pageNumber);

  page.append(content, number);
  return page;
}

function renderElement(element: SceneElement): string {
  const content = element.content.trimEnd();

  if (!content.trim()) {
    return "";
  }

  return `<div class="pdf-element pdf-element--${escapeHtml(element.type)}">${escapeHtml(content)}</div>`;
}

function getProjectTypeLabel(projectType: Project["projectType"]): string {
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

function sanitizeDocumentTitle(value: string): string {
  const sanitized = value
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized || "سيناريو";
}

function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function waitForDocumentReady(
  documentToPrint: Document,
): Promise<void> {
  if (documentToPrint.readyState !== "complete") {
    await new Promise<void>((resolve) => {
      documentToPrint.defaultView?.addEventListener(
        "load",
        () => resolve(),
        { once: true },
      );
    });
  }

  if ("fonts" in documentToPrint) {
    await documentToPrint.fonts.ready;
  }
}
