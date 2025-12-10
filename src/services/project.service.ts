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
