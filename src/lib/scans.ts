import { supabase } from "@/integrations/supabase/client";
import type { Result, Sign, Channel, Level } from "@/lib/analyzer";
import { redactSensitiveText } from "@/lib/sensitive-text";

export const PREVIEW_LEN = 120;

// Unsaved result for signed-out visitors; lives only in memory for this tab.
let unsaved: Result | null = null;
export const setUnsaved = (r: Result) => { unsaved = r; };
export const getUnsaved = (id: string) => (unsaved?.id === id ? unsaved : null);

type Row = {
  id: string; channel: string; preview: string; score: number; level: string;
  signs: unknown; actions: unknown; quiz: unknown; created_at: string;
};

const toResult = (r: Row): Result => ({
  id: r.id,
  channel: r.channel as Channel,
  message: r.preview,
  score: r.score,
  level: r.level as Level,
  signs: r.signs as Sign[],
  actions: r.actions as string[],
  quiz: r.quiz as Result["quiz"],
  createdAt: r.created_at,
});

export const makePreview = (msg: string) => {
  const t = redactSensitiveText(msg).text.replace(/\s+/g, " ").trim();
  return t.length > PREVIEW_LEN ? t.slice(0, PREVIEW_LEN - 1) + "…" : t;
};

export async function createScan(r: Result): Promise<string> {
  const { data, error } = await supabase
    .from("scans")
    .insert({
      channel: r.channel,
      preview: makePreview(r.message),
      score: r.score,
      level: r.level,
      signs: r.signs as never,
      actions: r.actions as never,
      quiz: r.quiz as never,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function listMyScans(): Promise<Result[]> {
  const { data, error } = await supabase.from("scans").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(toResult);
}

export async function getMyScan(id: string): Promise<Result | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase.from("scans").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toResult(data as Row) : null;
}
