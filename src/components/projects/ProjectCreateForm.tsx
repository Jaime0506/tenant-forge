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
            await handleSubmit(async (data: ProjectData) => {
                await createProject(data)
            })

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
        <div className="flex w-full flex-col gap-8">
            <form onSubmit={onSubmit} className="flex flex-col gap-8 flex-1">
                {/* Nombre del proyecto */}
                <div className="flex flex-col gap-2.5 px-1">
                    <label htmlFor="projectName" className="text-xs font-black text-cerulean-100 uppercase tracking-[0.2em]">
                        Nombre del proyecto
                    </label>
                    <input
                        id="projectName"
                        type="text"
                        value={form.name}
                        onChange={(e) => updateForm("name", e.target.value)}
                        placeholder="Ingresa el nombre del proyecto"
                        className="w-full px-4 py-3.5 rounded-xl border border-cerulean-500/20 bg-ink-black-950/80 text-white placeholder:text-ink-black-500 focus:outline-none focus:ring-2 focus:ring-cerulean-500/40 focus:border-cerulean-400/60 transition-all font-semibold shadow-inner"
                        required
                    />
                </div>

                {/* Descripción */}
                <div className="flex flex-col gap-2.5 px-1">
                    <label htmlFor="description" className="text-xs font-black text-cerulean-100 uppercase tracking-[0.2em]">
                        Descripción <span className="text-ink-black-400 font-medium normal-case tracking-normal">(opcional)</span>
                    </label>
                    <textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => updateForm("description", e.target.value)}
                        placeholder="Describe tu proyecto..."
                        rows={4}
                        className="w-full px-4 py-3.5 rounded-xl border border-cerulean-500/20 bg-ink-black-950/80 text-white placeholder:text-ink-black-500 focus:outline-none focus:ring-2 focus:ring-cerulean-500/40 focus:border-cerulean-400/60 transition-all resize-none font-semibold shadow-inner"
                    />
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-2.5 px-1">
                    <label htmlFor="tags" className="text-xs font-black text-cerulean-100 uppercase tracking-[0.2em]">
                        Tags <span className="text-ink-black-400 font-medium normal-case tracking-normal">(opcional)</span>
                    </label>
                    <div className="flex gap-3">
                        <input
                            id="tags"
                            type="text"
                            value={form.tagInput}
                            onChange={(e) => updateForm("tagInput", e.target.value)}
                            onKeyDown={handleTagInputKeyDown}
                            placeholder="Agrega un tag y presiona Enter"
                            className="flex-1 px-4 py-3.5 rounded-xl border border-cerulean-500/20 bg-ink-black-950/80 text-white placeholder:text-ink-black-500 focus:outline-none focus:ring-2 focus:ring-cerulean-500/40 focus:border-cerulean-400/60 transition-all font-semibold shadow-inner"
                        />
                        <Button
                            type="button"
                            onClick={handleAddTag}
                            variant="outline"
                            className="border-cerulean-500/30 text-cerulean-300 hover:bg-cerulean-500/20 hover:text-white rounded-xl h-auto px-6 py-3.5 font-black uppercase tracking-widest text-xs transition-all"
                            disabled={!form.tagInput.trim()}
                        >
                            Agregar
                        </Button>
                    </div>

                    {/* Lista de tags */}
                    {form.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2.5 mt-3">
                            {form.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black bg-cerulean-500/20 text-cerulean-200 border border-cerulean-400/30 uppercase tracking-widest shadow-sm"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="ml-1 hover:text-white transition-colors p-1 rounded-full hover:bg-cerulean-500/40"
                                        aria-label={`Eliminar tag ${tag}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Botón de envío */}
                <div className="flex justify-end gap-4 mt-auto pt-8 border-t border-cerulean-500/10">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        className="border-ink-black-700 text-ink-black-400 hover:bg-ink-black-800 hover:text-ink-black-100 rounded-xl h-auto px-8 py-3.5 font-black uppercase tracking-widest text-xs transition-all"
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
