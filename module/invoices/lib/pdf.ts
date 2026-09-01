import { jsPDF } from "jspdf";

/**
 * Rasterizes a DOM node (rendered off-screen at a fixed print width) into a multi-page A4 PDF.
 * Arabic text has no reliable font/shaping support in jsPDF's native text API, so the invoice is
 * drawn as normal HTML/CSS on screen and captured as an image instead — what you see is what ships.
 */
export async function renderNodeToPdfBlob(node: HTMLElement): Promise<Blob> {
  const { default: html2canvas } = await import("html2canvas");
  // html2canvas clones the page into a hidden offscreen iframe to read computed styles; tearing
  // that iframe down can log a harmless "Permissions policy violation: unload" warning on newer
  // Chrome (a deprecation notice from the cloned frame, not a real error) — the render still succeeds.
  const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const pxPerPdfPt = canvas.width / imgWidth;
  const pageHeightPx = pageHeight * pxPerPdfPt;

  let renderedHeightPx = 0;
  let pageIndex = 0;

  while (renderedHeightPx < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedHeightPx);

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightPx;
    const ctx = pageCanvas.getContext("2d")!;
    ctx.drawImage(
      canvas,
      0,
      renderedHeightPx,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      canvas.width,
      sliceHeightPx,
    );

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(
      pageCanvas.toDataURL("image/png"),
      "PNG",
      0,
      0,
      imgWidth,
      sliceHeightPx / pxPerPdfPt,
    );

    renderedHeightPx += sliceHeightPx;
    pageIndex += 1;
  }

  return pdf.output("blob");
}
