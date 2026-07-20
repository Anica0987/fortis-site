import { supabase } from "./supabaseClient.js";

export const uid = () => Math.random().toString(36).slice(2, 10);
export const todayISO = () => new Date().toISOString().slice(0, 10);

export function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt)) return "—";
  return dt.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}
export function daysUntil(d) {
  if (!d) return null;
  const dt = new Date(d + "T00:00:00");
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((dt - now) / 86400000);
}
export function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
export const num = (v) => { const n = parseFloat(String(v ?? "").replace(/[^0-9.-]/g, "")); return isNaN(n) ? 0 : n; };
export const moneyFmt = (v) => "R " + num(v).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const lineTotal = (g) => num(g.quantity || 1) * num(g.unitPrice);
export const quoteTotal = (goods) => (goods || []).reduce((sum, g) => sum + lineTotal(g), 0);

export const STATUS = {
  quote: { label: "Quote sent", color: "#D9663F", bg: "rgba(217,102,63,0.12)" },
  confirmed: { label: "PO confirmed", color: "#5C7A93", bg: "rgba(92,122,147,0.14)" },
  booked: { label: "Transport booked", color: "#8A6FD8", bg: "rgba(138,111,216,0.12)" },
  delivered: { label: "Delivered", color: "#4C8B5F", bg: "rgba(76,139,95,0.12)" },
  cancelled: { label: "Cancelled", color: "#A79E8E", bg: "rgba(167,158,142,0.16)" },
};

/* ---- key/value app state, mirrors the original app_state table usage ---- */
export async function loadKey(key, fallback) {
  try {
    const { data, error } = await supabase.from("app_state").select("value").eq("key", key).maybeSingle();
    if (error || !data) return fallback;
    return data.value ?? fallback;
  } catch (e) {
    return fallback;
  }
}
export async function saveKey(key, value) {
  try { await supabase.from("app_state").upsert({ key, value }); } catch (e) {}
}

/* ---- document attachments in the "fortis-docs" storage bucket ---- */
const DOCS_BUCKET = "fortis-docs";

export async function uploadDocument(orderId, docType, file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${orderId}/${docType}-${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(DOCS_BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  return { id: uid(), path, name: file.name, docType, uploadedAt: new Date().toISOString() };
}
export async function getDocumentUrl(path) {
  const { data, error } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}
export async function deleteDocument(path) {
  try { await supabase.storage.from(DOCS_BUCKET).remove([path]); } catch (e) {}
}
export async function deleteAllOrderDocuments(orderId) {
  try {
    const { data } = await supabase.storage.from(DOCS_BUCKET).list(orderId);
    if (data && data.length) {
      await supabase.storage.from(DOCS_BUCKET).remove(data.map((f) => `${orderId}/${f.name}`));
    }
  } catch (e) {}
}
