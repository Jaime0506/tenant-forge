import {
    createProjectService,
    getProjectsService,
    saveProjectService,
} from "@/services/project.service";
import { ProjectData } from "./useProject";
import { DatabaseConnection } from "@/components/project-editor/envParser";

export const useProjectService = () => {
    const createProject = async (data: ProjectData) => {
        await createProjectService(data);
    };

    const getProjects = async (
        callback?: (projects: ProjectData[]) => void
    ) => {
        try {
            const projects = (await getProjectsService()) as ProjectData[];
            callback?.(projects || []);
        } catch (error) {
            console.error("Error al obtener proyectos:", error);
            callback?.([]);
        }
    };

    const saveProject = async (id: number, data: DatabaseConnection[], scripts?: string) => {
        return saveProjectService(id, data, scripts);
    };

    return {
        createProject,
        getProjects,
        saveProject,
    };
};
