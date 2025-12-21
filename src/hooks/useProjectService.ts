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
        const projects = (await getProjectsService()) as ProjectData[];
        console.log("projects", projects);

        callback?.(projects);
    };

    const saveProject = async (id: number, data: DatabaseConnection[]) => {
        await saveProjectService(id, data);
    };

    return {
        createProject,
        getProjects,
        saveProject,
    };
};
