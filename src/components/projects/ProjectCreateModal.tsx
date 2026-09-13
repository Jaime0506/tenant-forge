import { useState, useEffect } from "react";
import { X, Plus, FolderPlus, Tag as TagIcon } from "lucide-react";
import { ProjectData, useProject } from "@/hooks/useProject";
import { useProjectService } from "@/hooks/useProjectService";
import ErrorBanner from "@/components/ui-custom/ErrorBanner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export default function ProjectCreateModal({
  isOpen,
  onClose,
  onProjectCreated,
}: ProjectCreateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { createProject } = useProjectService();

  const {
    form,
    updateForm,
    handleAddTag,
    handleRemoveTag,
    handleTagInputKeyDown,
    handleSubmit,
    handleReset,
  } = useProject();

  useEffect(() => {
    if (!isOpen) {
      handleReset();
      setErrorMessage(null);
    }
  }, [isOpen, handleReset]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMessage("El nombre del proyecto es obligatorio");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      await handleSubmit(async (data: ProjectData) => {
        await createProject(data);
      });

      toast.success("Proyecto creado con éxito");
      onProjectCreated();
      onClose();
    } catch (error) {
      console.error("Error al crear proyecto:", error);
      setErrorMessage(
        typeof error === "string" ? error : "No se pudo crear el proyecto. Intenta de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-surface-1 border border-surface-border rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header del Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-2/40">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-cerulean-500/10 border border-cerulean-500/20 flex items-center justify-center text-cerulean-400">
              <FolderPlus className="size-4.5" />
            </div>
            <div>
              <h3 id="modal-title" className="text-sm font-semibold text-foreground tracking-tight">
                Crear Nuevo Proyecto
              </h3>
              <p className="text-xs text-muted-foreground">
                Configura un espacio de trabajo para tus bases de datos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <ErrorBanner
              title="Error al crear proyecto"
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          {/* Nombre */}
          <div className="space-y-1.5">
            <label htmlFor="projectName" className="block text-xs font-medium text-foreground">
              Nombre del proyecto <span className="text-cerulean-400">*</span>
            </label>
            <input
              id="projectName"
              type="text"
              autoFocus
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
              placeholder="Ej: SaaS Core Multi-tenant, E-Commerce Shards..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-surface-base border border-surface-border focus:border-cerulean-500 focus:ring-1 focus:ring-cerulean-500 text-foreground placeholder:text-muted-foreground/60 transition-all outline-none"
              required
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="description" className="font-medium text-foreground">
                Descripción
              </label>
              <span className="text-muted-foreground text-[11px]">Opcional</span>
            </div>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              placeholder="Breve resumen del propósito o entorno del proyecto..."
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-lg bg-surface-base border border-surface-border focus:border-cerulean-500 focus:ring-1 focus:ring-cerulean-500 text-foreground placeholder:text-muted-foreground/60 transition-all outline-none resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="tagInput" className="font-medium text-foreground flex items-center gap-1.5">
                <TagIcon className="size-3 text-cerulean-400" />
                Tags y Etiquetas
              </label>
              <span className="text-muted-foreground text-[11px]">Presiona Enter para añadir</span>
            </div>

            <div className="flex gap-2">
              <input
                id="tagInput"
                type="text"
                value={form.tagInput}
                onChange={(e) => updateForm("tagInput", e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Ej: producción, staging, eu-west..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-surface-base border border-surface-border focus:border-cerulean-500 focus:outline-none text-foreground placeholder:text-muted-foreground/60"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={!form.tagInput.trim()}
                variant="surface"
                size="auto"
                className="px-3 py-1.5 text-xs shadow-none"
              >
                Añadir
              </Button>
            </div>

            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {form.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-2 text-cerulean-300 border border-surface-border"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-error transition-colors cursor-pointer"
                      aria-label={`Eliminar tag ${tag}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer de Acciones */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-border mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              disabled={isLoading || !form.name.trim()}
              variant="cta"
              size="auto"
              className="px-4 py-1.5 text-xs"
            >
              {isLoading ? (
                <div className="size-3.5 rounded-full border-2 border-surface-base border-t-transparent animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              <span>{isLoading ? "Creando..." : "Crear Proyecto"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
