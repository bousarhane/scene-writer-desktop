
import type {
  InteriorExterior,
  SceneElementType,
  TimeOfDay,
} from "../../types";

export interface ParsedScreenplayElement {
  type: SceneElementType;
  content: string;
}

export interface ParsedScreenplayScene {
  sourceSceneNumber: string;
  heading: string;
  interiorExterior: InteriorExterior;
  locationText: string;
  timeOfDay: TimeOfDay;
  customTimeOfDay: string | null;
  elements: ParsedScreenplayElement[];
}

export interface ParsedScreenplay {
  episodeTitle: string | null;
  scenes: ParsedScreenplayScene[];
  ignoredLines: string[];
}

const transitionPattern =
  /^(?:قطع|قطع إلى|مزج إلى|إظلام|ظهور تدريجي|اختفاء تدريجي|نهاية المشهد|نهاية الحلقة)\s*:?\s*$/i;

const scenePattern =
  /^(?:(?:المشهد|مشهد)\s*(?:رقم\s*)?[:：#№-]?\s*([0-9٠-٩۰-۹]+(?:\.[0-9٠-٩۰-۹]+)?)|([0-9٠-٩۰-۹]+(?:\.[0-9٠-٩۰-۹]+)?)\s*[-–—:]\s*(?:المشهد|مشهد))\s*[.)،:]?\s*$/i;

const headingPattern =
  /^(داخلي\s*\/\s*خارجي|خارجي\s*\/\s*داخلي|داخلي|خارجي)\s*[-–—ـ]\s*(.+)$/i;

const parentheticalPattern =
  /^\([^()]+\)$/;

const separatorPattern =
  /^[_\-=ـ]{5,}$/;

const episodeTitlePattern =
  /^الحلقة\s+[^:：]+[:：]\s*(.+)$/i;

const actionOpeningPattern =
  /^(?:ي|ت|ن|أ|إ|تُ|يُ|يظهر|تظهر|يقف|تقف|يجلس|تجلس|ينظر|تنظر|يمر|تمر|يدخل|تدخل|يخرج|تخرج|يتجه|تتجه|يرن|تتوقف|تنطلق|يقترب|تقترب|يرفع|ترفع|يمسك|تمسك|يستمر|تستمر|يقرر|تقرر|يضحك|تضحك|يبتعد|تبتعد|يسمع|يُسمع|نفس المكان)/;

export function parseScreenplayText(
  source: string,
): ParsedScreenplay {
  const lines = source
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) =>
      normalizeLine(line),
    );

  const episodeTitle =
    lines
      .map((line) =>
        episodeTitlePattern.exec(line),
      )
      .find(Boolean)?.[1]?.trim() ??
    null;

  const candidateCounts =
    collectCharacterCandidates(lines);

  const scenes: ParsedScreenplayScene[] =
    [];

  const ignoredLines: string[] =
    [];

  let currentScene:
    ParsedScreenplayScene | null =
      null;

  let expectsDialogue = false;
  let expectsDialogueAfterParenthetical =
    false;

  for (
    let index = 0;
    index < lines.length;
    index += 1
  ) {
    const line = lines[index];

    if (
      !line ||
      separatorPattern.test(line) ||
      /^نهاية الحلقة\s*$/i.test(line) ||
      episodeTitlePattern.test(line)
    ) {
      continue;
    }

    const sceneMatch =
      scenePattern.exec(line);

    if (sceneMatch) {
      currentScene = {
        sourceSceneNumber:
          normalizeArabicDigits(
            sceneMatch[1] ??
              sceneMatch[2],
          ),
        heading: "",
        interiorExterior:
          "unspecified",
        locationText: "",
        timeOfDay:
          "unspecified",
        customTimeOfDay: null,
        elements: [],
      };

      scenes.push(currentScene);
      expectsDialogue = false;
      expectsDialogueAfterParenthetical =
        false;
      continue;
    }

    if (!currentScene) {
      ignoredLines.push(line);
      continue;
    }

    const heading =
      parseHeading(line);

    if (
      heading &&
      currentScene.heading === ""
    ) {
      currentScene.heading =
        line;
      currentScene.interiorExterior =
        heading.interiorExterior;
      currentScene.locationText =
        heading.locationText;
      currentScene.timeOfDay =
        heading.timeOfDay;
      currentScene.customTimeOfDay =
        heading.customTimeOfDay;
      continue;
    }

    if (transitionPattern.test(line)) {
      currentScene.elements.push({
        type: "transition",
        content: normalizeTransition(
          line,
        ),
      });

      expectsDialogue = false;
      expectsDialogueAfterParenthetical =
        false;
      continue;
    }

    if (
      parentheticalPattern.test(line) &&
      (
        expectsDialogue ||
        currentScene.elements[
          currentScene.elements.length - 1
        ]?.type === "character"
      )
    ) {
      currentScene.elements.push({
        type: "parenthetical",
        content: line,
      });

      expectsDialogue = false;
      expectsDialogueAfterParenthetical =
        true;
      continue;
    }

    if (
      isCharacterLine(
        line,
        candidateCounts,
        lines[index + 1] ?? "",
      )
    ) {
      currentScene.elements.push({
        type: "character",
        content: line,
      });

      expectsDialogue = true;
      expectsDialogueAfterParenthetical =
        false;
      continue;
    }

    if (
      expectsDialogue ||
      expectsDialogueAfterParenthetical
    ) {
      currentScene.elements.push({
        type: "dialogue",
        content: line,
      });

      expectsDialogue = false;
      expectsDialogueAfterParenthetical =
        false;
      continue;
    }

    currentScene.elements.push({
      type: "action",
      content: line,
    });
  }

  for (const scene of scenes) {
    if (
      scene.elements.length === 0
    ) {
      scene.elements.push({
        type: "action",
        content: "",
      });
    }
  }

  return {
    episodeTitle,
    scenes,
    ignoredLines,
  };
}

function normalizeLine(
  line: string,
): string {
  return line
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function normalizeArabicDigits(
  value: string,
): string {
  const arabicIndicDigits =
    "٠١٢٣٤٥٦٧٨٩";

  const easternArabicDigits =
    "۰۱۲۳۴۵۶۷۸۹";

  return value.replace(
    /[٠-٩۰-۹]/g,
    (digit) => {
      const arabicIndicIndex =
        arabicIndicDigits.indexOf(
          digit,
        );

      if (arabicIndicIndex >= 0) {
        return String(
          arabicIndicIndex,
        );
      }

      return String(
        easternArabicDigits.indexOf(
          digit,
        ),
      );
    },
  );
}

function collectCharacterCandidates(
  lines: string[],
): Map<string, number> {
  const counts =
    new Map<string, number>();

  for (
    let index = 0;
    index < lines.length - 1;
    index += 1
  ) {
    const line = lines[index];
    const nextLine =
      lines[index + 1];

    if (
      !isPotentialCharacterShape(
        line,
      ) ||
      !nextLine ||
      scenePattern.test(line) ||
      headingPattern.test(line) ||
      transitionPattern.test(line) ||
      separatorPattern.test(line) ||
      episodeTitlePattern.test(line)
    ) {
      continue;
    }

    counts.set(
      line,
      (counts.get(line) ?? 0) + 1,
    );
  }

  return counts;
}

function isCharacterLine(
  line: string,
  counts: Map<string, number>,
  nextLine: string,
): boolean {
  if (
    !isPotentialCharacterShape(line) ||
    !nextLine
  ) {
    return false;
  }

  const count =
    counts.get(line) ?? 0;

  const roleLike =
    /^(?:الرجل|المرأة|السائق|سائق|الشرطي|الطبيب|الأم|الأب|الطفل|الطفلة|صوت|المذيع)(?:\s+[0-9٠-٩۰-۹]+)?$/i.test(
      line,
    );

  return count >= 2 || roleLike;
}

function isPotentialCharacterShape(
  line: string,
): boolean {
  if (
    !line ||
    line.length > 42 ||
    /[.!؟?،,:؛…]/.test(line) ||
    parentheticalPattern.test(line) ||
    actionOpeningPattern.test(line)
  ) {
    return false;
  }

  const wordCount =
    line.split(/\s+/).length;

  return (
    wordCount >= 1 &&
    wordCount <= 6
  );
}

function parseHeading(
  line: string,
): {
  interiorExterior:
    InteriorExterior;
  locationText: string;
  timeOfDay: TimeOfDay;
  customTimeOfDay: string | null;
} | null {
  const match =
    headingPattern.exec(line);

  if (!match) {
    return null;
  }

  const interiorExterior =
    normalizeInteriorExterior(
      match[1],
    );

  const parts =
    match[2]
      .split(/\s*[-–—ـ]\s*/)
      .map((part) => part.trim())
      .filter(Boolean);

  const rawTime =
    parts.length > 1
      ? parts[parts.length - 1] ?? ""
      : "";

  const parsedTime =
    parseTimeOfDay(rawTime);

  const locationText =
    parsedTime.timeOfDay ===
      "unspecified"
      ? parts.join(" - ")
      : parts
          .slice(0, -1)
          .join(" - ");

  return {
    interiorExterior,
    locationText,
    timeOfDay:
      parsedTime.timeOfDay,
    customTimeOfDay:
      parsedTime.customTimeOfDay,
  };
}

function normalizeInteriorExterior(
  value: string,
): InteriorExterior {
  const normalized =
    value.replace(/\s/g, "");

  if (
    normalized ===
      "داخلي/خارجي" ||
    normalized ===
      "خارجي/داخلي"
  ) {
    return "interior_exterior";
  }

  return normalized === "داخلي"
    ? "interior"
    : "exterior";
}

function parseTimeOfDay(
  value: string,
): {
  timeOfDay: TimeOfDay;
  customTimeOfDay: string | null;
} {
  const normalized =
    value.trim();

  const known:
    Array<[RegExp, TimeOfDay]> = [
      [/^نهار$/i, "day"],
      [/^ليل$/i, "night"],
      [/^صباح$/i, "morning"],
      [/^مساء$/i, "evening"],
      [/^فجر$/i, "dawn"],
      [/^غروب$/i, "sunset"],
      [/^استمرار$/i, "continuous"],
      [/^لاحق(?:ا|ًا)$/i, "later"],
    ];

  for (const [pattern, time] of known) {
    if (pattern.test(normalized)) {
      return {
        timeOfDay: time,
        customTimeOfDay: null,
      };
    }
  }

  if (normalized) {
    return {
      timeOfDay: "custom",
      customTimeOfDay:
        normalized,
    };
  }

  return {
    timeOfDay: "unspecified",
    customTimeOfDay: null,
  };
}

function normalizeTransition(
  line: string,
): string {
  const normalized =
    line.replace(/\s*:?\s*$/, "");

  if (/^قطع$/i.test(normalized)) {
    return "قطع";
  }

  return normalized;
}

