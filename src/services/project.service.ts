import { DatabaseConnection } from "@/components/project-editor/envParser";
import { ProjectData } from "@/hooks/useProject";
import { invoke } from "@tauri-apps/api/core";

export const createProjectService = (data: ProjectData) => {
    const payload: ProjectData = {
        name: data.name,
        description: data.description,
        tags: data.tags,
    };

    return invoke("create_proyect", {
        ...payload,
    });
};

export const getProjectsService = () => {
    return invoke("get_projects");
};

export const getProjectByIdService = (id: number) => {
    return invoke("get_project_by_id", { id });
};

export const saveProjectService = (id: number, data: DatabaseConnection[]) => {
    return invoke("save_project", { id, connections: data });
};
