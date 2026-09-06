import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const findTextCoordinates = async(pdfBuffer, searchText) => {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
  const pdfDocument = await loadingTask.promise;

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();

    for (const item of textContent.items) {
      if (item.str && item.str.includes(searchText)) {
        return {
          pageIndex: pageNum - 1,
          x: item.transform[4],
          y: item.transform[5],
        };
      }
    }
  }

  return null; 
}


export default {findTextCoordinates}
