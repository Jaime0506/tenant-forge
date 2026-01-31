import { useNavigate } from "react-router";
import { useEffect } from "react";

export default function ProjectEditorPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // Since we now use tabs in /main, this page is no longer the primary way to edit
        // We'll redirect to /main with the intent to open this project if it's hit directly
        navigate("/main", { replace: true });
    }, [navigate]);

    return null;
}
