import {
    createProjectService,
    getProjectsService,
} from "@/services/project.service";
import { ProjectData } from "./useProject";

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

    return {
        createProject,
        getProjects,
    };
};
