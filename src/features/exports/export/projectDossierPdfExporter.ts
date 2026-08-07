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

export type ProjectDossierSectionId =
  | "project-info"
  | "story"
  | "characters"
  | "locations"
  | "structure"
  | "screenplay";

export interface ProjectDossierPdfInput {
  project: Project;
  story: ProjectStory;
  characters: Character[];
  locations: Location[];
  seasons: Season[];
  episodes: Episode[];
  scenes: Scene[];
  elementsByScene: Record<string, SceneElement[]>;
  sections: ProjectDossierSectionId[];
  showCover: boolean;
}

export async function exportProjectDossierToPdf(
  input: ProjectDossierPdfInput,
): Promise<void> {
  if (input.sections.length === 0) {
    throw new Error("اختر قسمًا واحدًا على الأقل للتصدير.");
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

  const fileTitle = sanitizeDocumentTitle(
    `${input.project.title} - ملف المشروع`,
  );

  exportDocument.open();
  exportDocument.write(buildExportDocument(input, fileTitle));
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

function buildExportDocument(
  input: ProjectDossierPdfInput,
  fileTitle: string,
): string {
  const selectedSections = new Set(input.sections);
  const sourceMarkup = [
    selectedSections.has("project-info")
      ? renderProjectInfo(input.project)
      : "",
    selectedSections.has("story")
      ? renderStory(input.story)
      : "",
    selectedSections.has("characters")
      ? renderCharacters(input.characters)
      : "",
    selectedSections.has("locations")
      ? renderLocations(input.locations)
      : "",
    selectedSections.has("structure")
      ? renderStructure(input.seasons, input.episodes)
      : "",
    selectedSections.has("screenplay")
      ? renderScreenplay(input)
      : "",
  ].join("");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(fileTitle)}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      color: #171717;
      background: #fff;
      font-family: "Segoe UI", Tahoma, Arial, sans-serif;
      direction: rtl;
    }
    body {
      font-size: 11.5pt;
      line-height: 1.75;
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
      margin-bottom: 11mm;
      color: #6b5848;
      font-size: 11pt;
      font-weight: 800;
    }
    .pdf-cover h1 {
      max-width: 150mm;
      margin: 0;
      font-size: 28pt;
      line-height: 1.45;
    }
    .pdf-cover__subtitle {
      max-width: 150mm;
      margin-top: 5mm;
      color: #555;
      font-size: 15pt;
    }
    .pdf-cover__type {
      margin-top: 11mm;
      color: #777;
      font-size: 10.5pt;
    }
    .pdf-cover__author {
      display: grid;
      gap: 1.5mm;
      margin-top: 20mm;
    }
    .pdf-cover__author small {
      color: #777;
      font-size: 9pt;
    }
    .pdf-cover__author strong {
      font-size: 13pt;
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
    .dossier-section-title {
      margin: 0 0 7mm;
      padding-bottom: 3mm;
      border-bottom: 1px solid #cfc8c1;
      color: #2c2723;
      font-size: 19pt;
      line-height: 1.4;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .dossier-field {
      margin: 0 0 5mm;
    }
    .dossier-field__label {
      display: block;
      margin-bottom: 1mm;
      color: #80664f;
      font-size: 9.5pt;
      font-weight: 800;
    }
    .dossier-field__value {
      margin: 0;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      text-align: justify;
      text-align-last: right;
    }
    .dossier-card-title {
      margin: 5mm 0 3mm;
      color: #2d2b29;
      font-size: 14pt;
      line-height: 1.5;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .dossier-meta {
      margin: 0 0 4mm;
      color: #686868;
      font-size: 9.5pt;
    }
    .dossier-empty {
      margin: 0 0 6mm;
      color: #777;
      font-style: italic;
    }
    .screenplay-cover {
      display: flex;
      height: 100%;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 18mm;
      text-align: center;
    }
    .screenplay-cover__label {
      margin-bottom: 10mm;
      color: #6b5848;
      font-size: 11pt;
      font-weight: 800;
    }
    .screenplay-cover h1 {
      max-width: 145mm;
      margin: 0;
      font-size: 27pt;
      line-height: 1.45;
    }
    .screenplay-cover__subtitle {
      max-width: 145mm;
      margin-top: 5mm;
      color: #555;
      font-size: 15pt;
      line-height: 1.55;
    }
    .screenplay-cover__type {
      margin-top: 11mm;
      color: #777;
      font-size: 10.5pt;
    }
    .screenplay-cover__author {
      display: grid;
      gap: 1.5mm;
      margin-top: 20mm;
    }
    .screenplay-cover__author small {
      color: #777;
      font-size: 9pt;
    }
    .screenplay-cover__author strong {
      font-size: 13pt;
    }
    .screenplay-episode-title {
      margin: 7mm 0 5mm;
      padding: 3mm 4mm;
      border-right: 3px solid #84654b;
      background: #f6f2ed;
      font-size: 14pt;
      font-weight: 800;
      break-inside: avoid;
      page-break-inside: avoid;
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
      line-height: 1.55;
    }
    .pdf-element {
      margin: 0 0 3mm;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .pdf-element--action,
    .pdf-element--shot { text-align: right; }
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
    .pdf-element--centered_text { text-align: center; }
    .pdf-element--note {
      padding: 3mm 4mm;
      border-right: 2px solid #a7896e;
      color: #54483e;
      background: #f6f2ed;
      font-size: 10.5pt;
    }
    @media screen {
      body { background: #e9e9e9; }
      .pdf-cover,
      .pdf-page {
        margin: 8mm auto;
        box-shadow: 0 5px 24px rgba(0, 0, 0, 0.12);
      }
    }
    @media print {
      body { background: #fff; }
      .pdf-cover,
      .pdf-page {
        margin: 0;
        box-shadow: none;
      }
      .pdf-source { display: none; }
    }
  </style>
</head>
<body>
  ${input.showCover ? renderCover(input.project) : ""}
  <main id="pdf-pages"></main>
  <div id="pdf-source" class="pdf-source">${sourceMarkup}</div>
</body>
</html>`;
}

function renderCover(project: Project): string {
  const subtitle = project.subtitle?.trim()
    ? `<div class="pdf-cover__subtitle">${escapeHtml(project.subtitle)}</div>`
    : "";
  const author = project.authorName?.trim()
    ? `<div class="pdf-cover__author"><small>إعداد</small><strong>${escapeHtml(project.authorName)}</strong></div>`
    : "";

  return `<section class="pdf-cover">
    <div class="pdf-cover__label">ملف المشروع الدرامي</div>
    <h1>${escapeHtml(project.title)}</h1>
    ${subtitle}
    <div class="pdf-cover__type">${escapeHtml(getProjectTypeLabel(project.projectType))}</div>
    ${author}
  </section>`;
}

function renderProjectInfo(project: Project): string {
  return [
    sectionTitle("بيانات المشروع"),
    fieldBlock("العنوان", project.title),
    project.subtitle ? fieldBlock("العنوان الفرعي", project.subtitle) : "",
    fieldBlock("نوع المشروع", getProjectTypeLabel(project.projectType)),
    fieldBlock("الحالة", getProjectStatusLabel(project.status)),
    project.authorName ? fieldBlock("الكاتب", project.authorName) : "",
    project.description ? textFieldBlocks("وصف المشروع", project.description) : "",
    project.plannedSeasonCount !== null
      ? fieldBlock("عدد المواسم المخطط", project.plannedSeasonCount)
      : "",
    project.plannedEpisodeCount !== null
      ? fieldBlock("عدد الحلقات المخطط", project.plannedEpisodeCount)
      : "",
    project.defaultEpisodeDurationMinutes !== null
      ? fieldBlock("المدة المستهدفة", `${project.defaultEpisodeDurationMinutes} دقيقة`)
      : "",
  ].join("");
}

function renderStory(story: ProjectStory): string {
  const fields: Array<[string, string]> = [
    ["الفكرة", story.premise],
    ["الجملة التعريفية", story.logline],
    ["الملخص", story.synopsis],
    ["الموضوعات", story.themes],
    ["الصراع المركزي", story.centralConflict],
    ["نقطة البداية", story.startingPoint],
    ["الاتجاه المتوقع", story.expectedDirection],
    ["ملاحظات الكاتب", story.writerNotes],
  ];

  const content = fields
    .filter(([, value]) => value.trim())
    .map(([label, value]) => textFieldBlocks(label, value))
    .join("");

  return `${sectionTitle("الحكاية")}${content || emptyBlock("لا توجد بيانات محفوظة في قسم الحكاية.")}`;
}

function renderCharacters(characters: Character[]): string {
  const sorted = [...characters].sort(
    (first, second) =>
      first.orderIndex - second.orderIndex ||
      first.name.localeCompare(second.name, "ar"),
  );

  if (sorted.length === 0) {
    return `${sectionTitle("الشخصيات")}${emptyBlock("لا توجد شخصيات محفوظة.")}`;
  }

  return `${sectionTitle("الشخصيات")}${sorted
    .map((character) => {
      const meta = [
        getCharacterRoleLabel(character.role),
        getCharacterGenderLabel(character.gender),
        character.age ? `العمر: ${character.age}` : "",
      ].filter(Boolean).join(" · ");

      return [
        cardTitle(character.name),
        meta ? metaBlock(meta) : "",
        character.shortName ? fieldBlock("الاسم المختصر", character.shortName) : "",
        character.physicalDescription
          ? textFieldBlocks("الوصف الجسدي", character.physicalDescription)
          : "",
        character.personality
          ? textFieldBlocks("الطباع والشخصية", character.personality)
          : "",
        character.psychologicalProfile
          ? textFieldBlocks("الملف النفسي", character.psychologicalProfile)
          : "",
        character.goals ? textFieldBlocks("الأهداف", character.goals) : "",
        character.motivations ? textFieldBlocks("الدوافع", character.motivations) : "",
        character.background ? textFieldBlocks("الخلفية", character.background) : "",
        character.notes ? textFieldBlocks("ملاحظات", character.notes) : "",
      ].join("");
    })
    .join("")}`;
}

function renderLocations(locations: Location[]): string {
  const sorted = [...locations].sort((first, second) =>
    first.name.localeCompare(second.name, "ar"),
  );
  const byId = new Map(sorted.map((location) => [location.id, location]));

  if (sorted.length === 0) {
    return `${sectionTitle("الأماكن")}${emptyBlock("لا توجد أماكن محفوظة.")}`;
  }

  return `${sectionTitle("الأماكن")}${sorted
    .map((location) => {
      const parent = location.parentLocationId
        ? byId.get(location.parentLocationId) ?? null
        : null;

      return [
        cardTitle(location.name),
        metaBlock(
          [
            getLocationTypeLabel(location.type),
            parent ? `ضمن: ${parent.name}` : "",
          ].filter(Boolean).join(" · "),
        ),
        location.description
          ? textFieldBlocks("الوصف", location.description)
          : "",
        location.notes
          ? textFieldBlocks("ملاحظات", location.notes)
          : "",
      ].join("");
    })
    .join("")}`;
}

function renderStructure(
  seasons: Season[],
  episodes: Episode[],
): string {
  const sortedSeasons = [...seasons].sort(
    (first, second) =>
      first.orderIndex - second.orderIndex || first.number - second.number,
  );
  const sortedEpisodes = [...episodes].sort(
    (first, second) =>
      first.orderIndex - second.orderIndex || first.number - second.number,
  );

  if (sortedSeasons.length === 0 && sortedEpisodes.length === 0) {
    return `${sectionTitle("المواسم والحلقات")}${emptyBlock("لا توجد بيانات بنيوية محفوظة.")}`;
  }

  const parts: string[] = [sectionTitle("المواسم والحلقات")];

  for (const season of sortedSeasons) {
    parts.push(cardTitle(`الموسم ${season.number}${season.title ? ` - ${season.title}` : ""}`));
    if (season.description) {
      parts.push(textFieldBlocks("الوصف", season.description));
    }

    const seasonEpisodes = sortedEpisodes.filter(
      (episode) => episode.seasonId === season.id,
    );

    if (seasonEpisodes.length === 0) {
      parts.push(emptyBlock("لا توجد حلقات داخل هذا الموسم."));
      continue;
    }

    for (const episode of seasonEpisodes) {
      parts.push(renderEpisodeSummary(episode));
    }
  }

  const unassignedEpisodes = sortedEpisodes.filter(
    (episode) => episode.seasonId === null,
  );

  if (unassignedEpisodes.length > 0) {
    if (sortedSeasons.length > 0) {
      parts.push(cardTitle("حلقات بلا موسم"));
    }

    for (const episode of unassignedEpisodes) {
      parts.push(renderEpisodeSummary(episode));
    }
  }

  return parts.join("");
}

function renderEpisodeSummary(episode: Episode): string {
  const title = `الحلقة ${episode.number}${episode.title ? ` - ${episode.title}` : ""}`;
  const duration = `${episode.targetDurationMinutes} دقيقة`;
  const status = getEpisodeStatusLabel(episode.status);

  return [
    cardTitle(title),
    metaBlock(`${status} · ${duration}`),
    episode.synopsis ? textFieldBlocks("الملخص", episode.synopsis) : "",
    episode.notes ? textFieldBlocks("ملاحظات", episode.notes) : "",
  ].join("");
}

function renderScreenplay(input: ProjectDossierPdfInput): string {
  const sortedEpisodes = [...input.episodes].sort(
    (first, second) =>
      first.orderIndex - second.orderIndex || first.number - second.number,
  );
  const sortScenes = (scenes: Scene[]): Scene[] =>
    [...scenes].sort(
      (first, second) =>
        first.orderIndex - second.orderIndex ||
        compareSceneNumbers(first.sceneNumber, second.sceneNumber),
    );

  const parts: string[] = [renderScreenplayCover(input.project)];

  if (input.scenes.length === 0) {
    parts.push(emptyBlock("لا توجد مشاهد قابلة للتصدير."));
    return parts.join("");
  }

  if (sortedEpisodes.length > 0) {
    for (const episode of sortedEpisodes) {
      const episodeScenes = sortScenes(
        input.scenes.filter((scene) => scene.episodeId === episode.id),
      );

      if (episodeScenes.length === 0) {
        continue;
      }

      parts.push(
        episodeTitle(
          `الحلقة ${episode.number}${episode.title ? ` - ${episode.title}` : ""}`,
        ),
      );

      for (const scene of episodeScenes) {
        parts.push(renderScene(scene, input.elementsByScene[scene.id] ?? []));
      }
    }

    const unassignedScenes = sortScenes(
      input.scenes.filter((scene) => scene.episodeId === null),
    );

    if (unassignedScenes.length > 0) {
      parts.push(episodeTitle("مشاهد غير مرتبطة بحلقة"));
      for (const scene of unassignedScenes) {
        parts.push(renderScene(scene, input.elementsByScene[scene.id] ?? []));
      }
    }
  } else {
    for (const scene of sortScenes(input.scenes)) {
      parts.push(renderScene(scene, input.elementsByScene[scene.id] ?? []));
    }
  }

  return parts.join("");
}


function renderScreenplayCover(project: Project): string {
  const subtitle = project.subtitle?.trim()
    ? `<div class="screenplay-cover__subtitle">${escapeHtml(project.subtitle)}</div>`
    : "";
  const author = project.authorName?.trim()
    ? `<div class="screenplay-cover__author"><small>سيناريو</small><strong>${escapeHtml(project.authorName)}</strong></div>`
    : "";

  return `<section class="pdf-block pdf-special-cover screenplay-cover">
    <div class="screenplay-cover__label">السيناريو</div>
    <h1>${escapeHtml(project.title)}</h1>
    ${subtitle}
    <div class="screenplay-cover__type">${escapeHtml(getProjectTypeLabel(project.projectType))}</div>
    ${author}
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

function renderElement(element: SceneElement): string {
  const content = element.content.trimEnd();
  if (!content.trim()) {
    return "";
  }

  return `<div class="pdf-element pdf-element--${escapeHtml(element.type)}">${escapeHtml(content)}</div>`;
}

function sectionTitle(title: string): string {
  return `<h1 class="pdf-block dossier-section-title">${escapeHtml(title)}</h1>`;
}

function cardTitle(title: string): string {
  return `<h2 class="pdf-block dossier-card-title">${escapeHtml(title)}</h2>`;
}

function episodeTitle(title: string): string {
  return `<div class="pdf-block screenplay-episode-title">${escapeHtml(title)}</div>`;
}

function metaBlock(value: string): string {
  return value
    ? `<p class="pdf-block dossier-meta">${escapeHtml(value)}</p>`
    : "";
}

function emptyBlock(value: string): string {
  return `<p class="pdf-block dossier-empty">${escapeHtml(value)}</p>`;
}

function fieldBlock(label: string, value: string | number): string {
  return `<div class="pdf-block dossier-field">
    <span class="dossier-field__label">${escapeHtml(label)}</span>
    <p class="dossier-field__value">${escapeHtml(value)}</p>
  </div>`;
}

function textFieldBlocks(label: string, value: string): string {
  const chunks = splitLongText(value);

  if (chunks.length === 0) {
    return "";
  }

  return chunks
    .map((chunk, index) =>
      `<div class="pdf-block dossier-field">
        ${index === 0 ? `<span class="dossier-field__label">${escapeHtml(label)}</span>` : ""}
        <p class="dossier-field__value">${escapeHtml(chunk)}</p>
      </div>`,
    )
    .join("");
}

function splitLongText(value: string): string[] {
  const paragraphs = value
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length <= 900) {
      chunks.push(paragraph);
      continue;
    }

    let remaining = paragraph;
    while (remaining.length > 900) {
      let splitAt = remaining.lastIndexOf(" ", 900);
      if (splitAt < 450) {
        splitAt = 900;
      }
      chunks.push(remaining.slice(0, splitAt).trim());
      remaining = remaining.slice(splitAt).trim();
    }

    if (remaining) {
      chunks.push(remaining);
    }
  }

  return chunks;
}

function paginateDocument(documentToPrint: Document): void {
  const source = documentToPrint.getElementById("pdf-source");
  const pagesRoot = documentToPrint.getElementById("pdf-pages");

  if (!source || !pagesRoot) {
    throw new Error("تعذر بناء صفحات التصدير.");
  }

  const blocks = Array.from(source.children).map(
    (node) => node.cloneNode(true) as HTMLElement,
  );

  let pageNumber = 0;
  let currentContent: HTMLElement | null = null;

  const createNumberedPage = (): HTMLElement => {
    pageNumber += 1;
    const page = createPage(documentToPrint, pageNumber);
    pagesRoot.appendChild(page);

    const content = page.querySelector<HTMLElement>(
      ".pdf-page__content",
    );

    if (!content) {
      throw new Error("تعذر إنشاء محتوى صفحة التصدير.");
    }

    return content;
  };

  for (const block of blocks) {
    if (block.classList.contains("pdf-special-cover")) {
      const coverPage = createPage(documentToPrint, null);
      const coverContent = coverPage.querySelector<HTMLElement>(
        ".pdf-page__content",
      );

      if (!coverContent) {
        throw new Error("تعذر إنشاء غلاف السيناريو.");
      }

      coverContent.appendChild(block);
      pagesRoot.appendChild(coverPage);
      currentContent = null;
      continue;
    }

    if (!currentContent) {
      currentContent = createNumberedPage();
    }

    currentContent.appendChild(block);

    if (currentContent.scrollHeight <= currentContent.clientHeight + 1) {
      continue;
    }

    currentContent.removeChild(block);

    if (currentContent.children.length === 0) {
      currentContent.appendChild(block);
      continue;
    }

    currentContent = createNumberedPage();
    currentContent.appendChild(block);
  }

  source.remove();
}

function createPage(
  documentToPrint: Document,
  pageNumber: number | null,
): HTMLElement {
  const page = documentToPrint.createElement("section");
  page.className = "pdf-page";

  const content = documentToPrint.createElement("div");
  content.className = "pdf-page__content";

  const number = documentToPrint.createElement("div");
  number.className = "pdf-page__number";
  number.textContent = pageNumber === null ? "" : String(pageNumber);

  page.append(content, number);
  return page;
}

function getProjectTypeLabel(projectType: Project["projectType"]): string {
  switch (projectType) {
    case "film":
      return "فيلم سينمائي";
    case "short_film":
      return "فيلم قصير";
    case "series":
      return "مسلسل تلفزيوني";
    case "single_episode":
      return "حلقة منفردة";
    case "stage_play":
      return "مسرحية";
  }
}

function getProjectStatusLabel(status: Project["status"]): string {
  switch (status) {
    case "draft":
      return "مسودة";
    case "in_progress":
      return "قيد الإنجاز";
    case "review":
      return "قيد المراجعة";
    case "completed":
      return "مكتمل";
    case "archived":
      return "مؤرشف";
  }
}

function getCharacterRoleLabel(role: Character["role"]): string {
  switch (role) {
    case "main":
      return "رئيسية";
    case "supporting":
      return "مساندة";
    case "secondary":
      return "ثانوية";
    case "minor":
      return "صغيرة";
    case "extra":
      return "كومبارس";
    case "unspecified":
      return "دور غير محدد";
  }
}

function getCharacterGenderLabel(gender: Character["gender"]): string {
  switch (gender) {
    case "male":
      return "ذكر";
    case "female":
      return "أنثى";
    case "other":
      return "آخر";
    case "unspecified":
      return "النوع غير محدد";
  }
}

function getLocationTypeLabel(type: Location["type"]): string {
  switch (type) {
    case "house":
      return "منزل";
    case "room":
      return "غرفة";
    case "street":
      return "شارع";
    case "workplace":
      return "مكان عمل";
    case "public_space":
      return "فضاء عام";
    case "vehicle":
      return "وسيلة نقل";
    case "rural":
      return "فضاء قروي";
    case "other":
      return "مكان آخر";
  }
}

function getEpisodeStatusLabel(status: Episode["status"]): string {
  switch (status) {
    case "outline":
      return "تصور أولي";
    case "draft":
      return "مسودة";
    case "review":
      return "قيد المراجعة";
    case "final":
      return "نهائي";
  }
}

function compareSceneNumbers(first: string, second: string): number {
  const firstNumber = Number(first);
  const secondNumber = Number(second);

  if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber)) {
    return firstNumber - secondNumber;
  }

  return first.localeCompare(second, "ar", { numeric: true });
}

function sanitizeDocumentTitle(value: string): string {
  const sanitized = value
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized || "ملف المشروع";
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
