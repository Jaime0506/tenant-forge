import { storeManagement } from "@/store/storeManagement";
import { useEffect, useState } from "react";

export default function useStoreManagement() {
    const [theme, setTheme] = useState<string | undefined>(undefined);
    const [isFirstTime, setIsFirstTime] = useState<boolean | undefined>(
        undefined
    );

    const getTheme = async () => {
        try {
            const theme = await storeManagement.get<string>("theme");
            setTheme(theme ?? undefined);
        } catch (error) {
            console.error("Error getting theme:", error);
        }
    };
    const getIsFirstTime = async () => {
        try {
            const isFirstTime = await storeManagement.get<boolean>(
                "isFirstTime"
            );
            setIsFirstTime(isFirstTime ?? true); // Default to true if null
        } catch (error) {
            console.error("Error getting isFirstTime:", error);
            setIsFirstTime(true); // Default to true on error
        }
    };

    const setThemeInStore = async (theme: string) => {
        try {
            await storeManagement.set("theme", theme);
            setTheme(theme);
        } catch (error) {
            console.error("Error setting theme:", error);
        }
    };
    const setIsFirstTimeInStore = async (isFirstTime: boolean) => {
        try {
            await storeManagement.set("isFirstTime", isFirstTime);
            setIsFirstTime(isFirstTime);
        } catch (error) {
            console.error("Error setting isFirstTime:", error);
            throw error;
        }
    };

    const getInitialData = async () => {
        await getTheme();
        await getIsFirstTime();
    };

    useEffect(() => {
        getInitialData();
    }, []);

    return {
        theme,
        isFirstTime,
        methods: {
            setThemeInStore,
            setIsFirstTimeInStore,
        },
    };
}
