import { ProjectRepository } from "@/domains/project/types";
import { Project } from "@/types/project.types";

import { supabase } from "@/infrastructure/supabase/client";

interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  data: Project;
  created_at: string;
  updated_at: string;
}

async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  return user.id;
}

export class SupabaseProjectRepository implements ProjectRepository {
  async save(project: Project): Promise<ProjectRow> {
    const userId = await requireUserId();

    const payload = {
      id: project.id,
      user_id: userId,
      name: project.name,
      data: project,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("projects")
      .upsert(payload, { onConflict: "id" })
      .select("id, user_id, name, data, created_at, updated_at")
      .single();

    if (error) {
      throw error;
    }

    return data as ProjectRow;
  }

  async load(id: string): Promise<Project | null> {
    const userId = await requireUserId();

    const { data, error } = await supabase
      .from("projects")
      .select("data")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data?.data as Project) ?? null;
  }

  async listForCurrentUser(): Promise<ProjectRow[]> {
    const userId = await requireUserId();

    const { data, error } = await supabase
      .from("projects")
      .select("id, user_id, name, data, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as ProjectRow[];
  }

  async delete(id: string): Promise<void> {
    const userId = await requireUserId();

    const { error } = await supabase.from("projects").delete().eq("id", id).eq("user_id", userId);

    if (error) {
      throw error;
    }
  }
}

export const supabaseProjectRepository = new SupabaseProjectRepository();
