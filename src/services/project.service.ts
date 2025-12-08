import { ProjectData } from "@/hooks/useProject";
import { invoke } from "@tauri-apps/api/core";

export const createProjectService = (data: ProjectData) => {
    return invoke("create_proyect", { ...data });
};
