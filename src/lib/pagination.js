export const CONTENTS_ENTRIES_PER_PAGE = 10;

export function paginateCharacters(characters) {
  if (characters.length === 0) return [[]];

  const pages = [];
  for (let index = 0; index < characters.length; index += CONTENTS_ENTRIES_PER_PAGE) {
    pages.push(characters.slice(index, index + CONTENTS_ENTRIES_PER_PAGE));
  }
  return pages;
}

function createTextMeasurer(source, height = source?.clientHeight) {
  if (!source || source.clientWidth === 0 || height === undefined) return null;
  if (height <= 0) {
    return {
      fits: (candidate) => !candidate.trim(),
      remove() {},
    };
  }

  const measurement = source.cloneNode(false);
  Object.assign(measurement.style, {
    position: "fixed",
    top: "0",
    left: "-10000px",
    display: "block",
    width: `${source.clientWidth}px`,
    height: `${height}px`,
    minHeight: "0",
    maxHeight: "none",
    flex: "none",
    margin: "0",
    overflow: "hidden",
    visibility: "hidden",
  });
  document.body.appendChild(measurement);

  return {
    fits(candidate) {
      measurement.textContent = candidate;
      return measurement.scrollHeight <= measurement.clientHeight + 1;
    },
    remove() {
      measurement.remove();
    },
  };
}

export function paginateTextAcrossPages(text, leftElement, rightElement, rightPageContent) {
  if (!leftElement || !rightElement || !rightPageContent) return null;

  const fullPageHeight = rightPageContent.clientHeight
    - parseFloat(getComputedStyle(rightPageContent).paddingTop)
    - parseFloat(getComputedStyle(rightPageContent).paddingBottom);
  const measurers = [
    createTextMeasurer(leftElement),
    createTextMeasurer(rightElement),
    createTextMeasurer(rightElement, fullPageHeight),
  ];

  if (measurers.some((measurer) => !measurer)) {
    measurers.forEach((measurer) => measurer?.remove());
    return null;
  }

  try {
    const words = text.match(/\S+\s*/g) || [];
    const pages = [];
    let wordIndex = 0;

    while (wordIndex < words.length) {
      const measurer = measurers[Math.min(pages.length, 2)];
      let low = 0;
      let high = words.length - wordIndex;

      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        const candidate = words.slice(wordIndex, wordIndex + middle).join("").trimEnd();
        if (measurer.fits(candidate)) low = middle;
        else high = middle - 1;
      }

      if (low === 0 && pages.length < 2) {
        pages.push("");
        continue;
      }

      const wordCount = Math.max(low, 1);
      pages.push(words.slice(wordIndex, wordIndex + wordCount).join("").trim());
      wordIndex += wordCount;
    }

    return pages.length ? pages : [""];
  } finally {
    measurers.forEach((measurer) => measurer.remove());
  }
}
