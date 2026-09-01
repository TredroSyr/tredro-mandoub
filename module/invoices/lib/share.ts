import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/** Opens the customer's exact WhatsApp chat directly (no contact picker) with a pre-filled text message. */
export function buildWhatsAppChatUrl(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function openWhatsAppChat(phone: string, text: string) {
  window.open(buildWhatsAppChatUrl(phone, text), "_blank", "noreferrer");
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Hands the PDF to the OS share sheet (native) so the rep can pick WhatsApp — or any other app —
 * and attach the actual file. There is no public API to preselect a WhatsApp contact for a file
 * share, so this always lands on WhatsApp's own contact list; the rep taps the customer once there.
 * Falls back to the Web Share API, then a plain download, when running outside the native app.
 */
export async function shareInvoicePdf(blob: Blob, fileName: string, title: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const base64 = await blobToBase64(blob);
    await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
    const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
    await Share.share({ title, url: uri, dialogTitle: title });
    return;
  }

  const file = new File([blob], fileName, { type: "application/pdf" });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title, files: [file] });
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
