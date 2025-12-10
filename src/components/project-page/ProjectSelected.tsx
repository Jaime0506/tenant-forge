import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import EnvEditor from "./EnvEditor";
import SqlEditor from "./SqlEditor";

interface ProjectSelectedProps {
    id: number;
}

export default function ProjectSelected({ id }: ProjectSelectedProps) {
    const navigate = useNavigate();
    const [envContent, setEnvContent] = useState("");
    const [sqlContent, setSqlContent] = useState("");

    return (
        <main className="flex w-full h-full rounded-lg border border-gray-200 dark:border-gray-800 flex-col gap-6 p-6 bg-card">
            {/* Mini menú de navegación */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="gap-2"
                >
                    <ArrowLeft className="size-4" />
                    Volver
                </Button>
                <h1 className="text-lg font-semibold text-foreground">
                    Proyecto #{id}
                </h1>
            </div>

            {/* Contenedor principal con dos columnas */}
            <div className="flex flex-1 overflow-hidden gap-6">
                {/* Columna izquierda - Editor .env */}
                <div className="flex flex-col w-1/2 border border-border rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <h2 className="text-sm font-medium text-foreground">
                            Variables de Entorno (.env)
                        </h2>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <EnvEditor value={envContent} onChange={setEnvContent} />
                    </div>
                </div>

                {/* Columna derecha - Editor SQL */}
                <div className="flex flex-col w-1/2 border border-border rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <h2 className="text-sm font-medium text-foreground">
                            Editor SQL (PostgreSQL)
                        </h2>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <SqlEditor value={sqlContent} onChange={setSqlContent} />
                    </div>
                </div>
            </div>
        </main>
    )
}
