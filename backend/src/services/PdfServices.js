import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const findTextCoordinates = async(pdfBuffer, searchText) => {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
  const pdfDocument = await loadingTask.promise;

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();

    for (const item of textContent.items) {
      if (item.str && item.str.includes(searchText)) {
        // Trong hệ tọa độ PDF:
        // item.transform[4] là tọa độ X
        // item.transform[5] là tọa độ Y (tính từ đáy trang đi lên)
        return {
          pageIndex: pageNum - 1,
          x: item.transform[4],
          y: item.transform[5],
        };
      }
    }
  }

  return null; // Không tìm thấy marker
}


export default {findTextCoordinates}
