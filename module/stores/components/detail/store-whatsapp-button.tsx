import { IconRenderer } from "@/assets/icons/iconRenderer";

export function StoreWhatsappButton({ phone }: { phone: string }) {
  return (
    <a
      href={`https://wa.me/${phone.replace(/\D/g, "")}`}
      target="_blank"
      rel="noreferrer"
      className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-xs font-bold text-primary"
    >
      <IconRenderer name="whatsapp_outlined" className="size-4" /> <span dir="ltr">{phone}</span>
    </a>
  );
}
