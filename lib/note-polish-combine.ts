export type NotePolishFields = {
  title: string;
  content: string;
};

export function combineOriginalAndPolished(
  original: NotePolishFields,
  polished: NotePolishFields
): NotePolishFields {
  const originalBody = original.content.trim();
  const polishedBody = polished.content.trim();

  let content: string;
  if (!originalBody && !polishedBody) {
    content = "";
  } else if (!originalBody) {
    content = polishedBody;
  } else if (!polishedBody) {
    content = originalBody;
  } else if (originalBody === polishedBody) {
    content = originalBody;
  } else {
    content = `--- Original ---\n\n${originalBody}\n\n--- AI polished ---\n\n${polishedBody}`;
  }

  const titleDiffers =
    original.title.trim() !== polished.title.trim() &&
    polished.title.trim().length > 0;

  if (titleDiffers && content) {
    content = `Title (polished): ${polished.title.trim()}\n\n${content}`;
  }

  return {
    title: original.title.trim() || polished.title.trim(),
    content,
  };
}
