import { storeManagement } from "@/store/storeManagement";
import { useEffect, useState } from "react";

export default function useStoreManagement() {
    const [theme, setTheme] = useState<string | undefined>(undefined);
    const [isFirstTime, setIsFirstTime] = useState<boolean | undefined>(
        undefined
    );
    const [isEnvEditorWarningShown, setIsEnvEditorWarningShown] = useState<
        boolean | undefined
    >(undefined);

    const getIsEnvEditorWarningShown = async () => {
        try {
            const isEnvEditorWarningShown = await storeManagement.get<boolean>(
                "isEnvEditorWarningShown"
            );
            setIsEnvEditorWarningShown(isEnvEditorWarningShown ?? true);
        } catch (error) {
            console.error("Error getting isEnvEditorWarningShown:", error);
        }
    };

    const [isDebugModeEnabled, setIsDebugModeEnabled] = useState<boolean>(false);

    const getIsDebugModeEnabled = async () => {
        try {
            const isEnabled = await storeManagement.get<boolean>("isDebugModeEnabled");
            setIsDebugModeEnabled(isEnabled ?? false);
        } catch (error) {
            console.error("Error getting isDebugModeEnabled:", error);
        }
    };

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

    const setIsEnvEditorWarningShownInStore = async (
        isEnvEditorWarningShown: boolean
    ) => {
        try {
            await storeManagement.set(
                "isEnvEditorWarningShown",
                isEnvEditorWarningShown
            );
            setIsEnvEditorWarningShown(isEnvEditorWarningShown);
        } catch (error) {
            console.error("Error setting isEnvEditorWarningShown:", error);
            throw error;
        }
    };

    const setIsDebugModeEnabledInStore = async (enabled: boolean) => {
        try {
            await storeManagement.set("isDebugModeEnabled", enabled);
            setIsDebugModeEnabled(enabled);
        } catch (error) {
            console.error("Error setting isDebugModeEnabled:", error);
            throw error;
        }
    };

    const getInitialData = async () => {
        await getTheme();
        await getIsFirstTime();
        await getIsEnvEditorWarningShown();
        await getIsDebugModeEnabled();
    };

    useEffect(() => {
        getInitialData();
    }, []);

    return {
        theme,
        isFirstTime,
        isEnvEditorWarningShown,
        isDebugModeEnabled,
        methods: {
            setThemeInStore,
            setIsFirstTimeInStore,
            setIsEnvEditorWarningShownInStore,
            setIsDebugModeEnabledInStore,
        },
    };
}
