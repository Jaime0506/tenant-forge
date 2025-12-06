import { getStore } from "./store";
import type { Store } from "@tauri-apps/plugin-store";

let storeInstance: Store | null = null;

// Inicializar el store de forma lazy
const getStoreInstance = async (): Promise<Store> => {
    if (!storeInstance) {
        storeInstance = await getStore();
    }
    return storeInstance;
};

export const storeManagement = {
    async get<T>(key: string): Promise<T | null> {
        try {
            const store = await getStoreInstance();
            return (await store.get<T>(key)) ?? null;
        } catch (error) {
            console.error(`Error getting ${key} from store:`, error);
            return null;
        }
    },
    async set(key: string, value: unknown): Promise<void> {
        try {
            const store = await getStoreInstance();
            await store.set(key, value);
            await store.save();
        } catch (error) {
            console.error(`Error setting ${key} in store:`, error);
            throw error;
        }
    },
};
