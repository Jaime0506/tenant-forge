// Este es el store de que provee tauri para persistir datos en la aplicación
import { load } from "@tauri-apps/plugin-store";
import type { Store } from "@tauri-apps/plugin-store";

let store: Store | null = null;

const loadStore = async () => {
    store = await load("store.json", {
        autoSave: false,
        defaults: {
            theme: "dark",
            isFirstTime: true,
        },
    });

    return store;
};

export const getStore = async () => {
    if (!store) {
        await loadStore();
    }

    return store as Store;
};
