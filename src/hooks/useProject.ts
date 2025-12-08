import { useState } from "react";

export interface ProjectForm {
    name: string;
    description: string;
    tags: string[];
    tagInput: string;
}

export interface ProjectData {
    name: string;
    description: string;
    tags: string[];
}

export type ProjectSubmitCallback<T = void> = (
    data: ProjectData
) => T | Promise<T>;

const initialFormState: ProjectForm = {
    name: "",
    description: "",
    tags: [],
    tagInput: "",
};

export const useProject = <T = void>(
    onSubmitCallback?: ProjectSubmitCallback<T>
) => {
    const [form, setForm] = useState<ProjectForm>(initialFormState);

    const updateForm = (field: keyof ProjectForm, value: string | string[]) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddTag = () => {
        const trimmedTag = form.tagInput.trim();
        if (trimmedTag && !form.tags.includes(trimmedTag)) {
            setForm((prev) => ({
                ...prev,
                tags: [...prev.tags, trimmedTag],
                tagInput: "",
            }));
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setForm((prev) => ({
            ...prev,
            tags: prev.tags.filter((tag) => tag !== tagToRemove),
        }));
    };

    const handleTagInputKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleSubmit = (customCallback?: ProjectSubmitCallback<T>) => {
        const projectData: ProjectData = {
            name: form.name,
            description: form.description,
            tags: form.tags,
        };

        // Aquí puedes agregar la lógica para guardar el proyecto
        console.log(projectData);

        const callback = customCallback || onSubmitCallback;
        if (callback) {
            return callback(projectData);
        }
    };

    const handleReset = () => {
        setForm(initialFormState);
    };

    return {
        form,
        updateForm,
        handleAddTag,
        handleRemoveTag,
        handleTagInputKeyDown,
        handleSubmit,
        handleReset,
    };
};
