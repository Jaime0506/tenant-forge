import { useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";

const GITHUB_REPO = "Jaime0506/tenant-forge";
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

/**
 * Convierte un string de versión (ej. "v1.2.3" o "1.2.3") a un array de números [1, 2, 3]
 */
const parseVersion = (versionStr: string): number[] => {
    // Eliminar la 'v' inicial si existe y separar por puntos
    return versionStr
        .replace(/^v/i, "")
        .split(".")
        .map((part) => parseInt(part, 10) || 0);
};

/**
 * Compara dos versiones. Retorna true si 'remote' es superior a 'local'.
 */
const isNewerVersion = (local: string, remote: string): boolean => {
    const vLocal = parseVersion(local);
    const vRemote = parseVersion(remote);

    const maxLength = Math.max(vLocal.length, vRemote.length);

    for (let i = 0; i < maxLength; i++) {
        const numLocal = vLocal[i] || 0;
        const numRemote = vRemote[i] || 0;

        if (numRemote > numLocal) return true;
        if (numRemote < numLocal) return false;
    }

    return false;
};

export const useUpdateChecker = () => {
    useEffect(() => {
        const checkForUpdates = async () => {
            try {
                // 1. Obtener la versión local de la app (ej. "0.1.3")
                const currentVersion = await getVersion();

                // 2. Consultar la última release en GitHub
                const response = await fetch(API_URL);

                if (!response.ok) {
                    throw new Error(
                        `Error fetching release: ${response.statusText}`,
                    );
                }

                const data = await response.json();
                const latestVersion = data.tag_name;
                const releaseUrl = data.html_url;

                // 3. Comparar versiones
                if (
                    latestVersion &&
                    isNewerVersion(currentVersion, latestVersion)
                ) {
                    // 4. Mostrar el Toast interactivo
                    toast.info(
                        `¡Nueva versión disponible! (${latestVersion})`,
                        {
                            description:
                                "Hay una actualización de Tenant Forge esperándote.",
                            duration: 15000, // 15 segundos en pantalla
                            action: {
                                label: "Descargar",
                                onClick: () => {
                                    // Abrir el link en el navegador por defecto
                                    openUrl(releaseUrl).catch(
                                        (err: unknown) => {
                                            console.error(
                                                "Error abriendo enlace:",
                                                err,
                                            );
                                        },
                                    );
                                },
                            },
                        },
                    );
                }
            } catch (error) {
                // Falla silenciosa. No queremos molestar al usuario si no hay internet o si la API de GitHub falla.
                console.warn("No se pudo comprobar la actualización:", error);
            }
        };

        // Ejecutar la comprobación con un pequeño delay (3s) para no bloquear ni afectar la carga inicial de la UI
        const timeout = setTimeout(() => {
            checkForUpdates();
        }, 3000);

        return () => clearTimeout(timeout);
    }, []);
};
