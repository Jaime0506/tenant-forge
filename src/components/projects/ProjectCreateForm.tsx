import { Button } from "@/components/ui/button";
import { ProjectData, useProject } from "@/hooks/useProject";
import { useProjectService } from "@/hooks/useProjectService";
import { useState } from "react";
import ButtonCustom from "../ui-custom/ButtonCustom";

interface ProjectCreateFormProps {
    onProjectCreated?: () => void;
}

export default function ProjectCreateForm({ onProjectCreated }: ProjectCreateFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { createProject } = useProjectService()

    const {
        form,
        updateForm,
        handleAddTag,
        handleRemoveTag,
        handleTagInputKeyDown,
        handleSubmit,
        handleReset
    } = useProject();

    const onSubmit = async (e: React.FormEvent,) => {
        e.preventDefault()

        try {
            setIsLoading(true);
            const result = await handleSubmit(async (data: ProjectData) => {
                await createProject(data)
            })

            console.log(result);
            
            // Llamar al callback después de crear el proyecto exitosamente
            if (onProjectCreated) {
                onProjectCreated();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
            handleReset();
        }
    }

    return (
        <div className="flex w-full flex-col gap-6">
            <form onSubmit={onSubmit} className="flex flex-col gap-6 flex-1">
                {/* Nombre del proyecto */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="projectName" className="text-sm font-medium text-foreground">
                        Nombre del proyecto
                    </label>
                    <input
                        id="projectName"
                        type="text"
                        value={form.name}
                        onChange={(e) => updateForm("name", e.target.value)}
                        placeholder="Ingresa el nombre del proyecto"
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-input/30 dark:border-input"
                        required
                    />
                </div>

                {/* Descripción */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="description" className="text-sm font-medium text-foreground">
                        Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
                    </label>
                    <textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => updateForm("description", e.target.value)}
                        placeholder="Describe tu proyecto..."
                        rows={4}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none dark:bg-input/30 dark:border-input"
                    />
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="tags" className="text-sm font-medium text-foreground">
                        Tags <span className="text-muted-foreground font-normal">(opcional)</span>
                    </label>
                    <div className="flex gap-2">
                        <input
                            id="tags"
                            type="text"
                            value={form.tagInput}
                            onChange={(e) => updateForm("tagInput", e.target.value)}
                            onKeyDown={handleTagInputKeyDown}
                            placeholder="Agrega un tag y presiona Enter"
                            className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-input/30 dark:border-input"
                        />
                        <Button
                            type="button"
                            onClick={handleAddTag}
                            variant="outline"
                            disabled={!form.tagInput.trim()}
                        >
                            Agregar
                        </Button>
                    </div>

                    {/* Lista de tags */}
                    {form.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {form.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-secondary text-secondary-foreground border border-border"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="ml-1 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring rounded"
                                        aria-label={`Eliminar tag ${tag}`}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Botón de envío */}
                <div className="flex justify-end gap-3 mt-auto pt-4 border-t border-border">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                    >
                        Limpiar
                    </Button>
                    <ButtonCustom type="submit" isLoading={isLoading}>
                        Crear proyecto
                    </ButtonCustom>
                </div>
            </form>
        </div>
    );
}
