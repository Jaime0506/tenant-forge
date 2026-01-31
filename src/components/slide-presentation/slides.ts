import {
    Database,
    Server,
    Zap,
    CheckCircle2,
    Play,
    Terminal,
    Code2,
    Table,
    Activity,
    Filter,
    LayoutGrid,
    FileText,
    Shield,
    ListChecks,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface SlideFeature {
    icon: LucideIcon;
    text: string;
}

export interface SlideContent {
    main: string;
    features: SlideFeature[];
}

export interface Slide {
    id: number;
    title: string;
    subtitle?: string;
    content: SlideContent;
}

export const slides: Slide[] = [
    {
        id: 1,
        title: "",
        content: {
            main: "",
            features: [],
        },
    },
    {
        id: 2,
        title: "¿Qué hace TenantForge?",
        content: {
            main: "TenantForge es una plataforma potente para la ejecución de SQL simultánea en entornos multi-tenant.",
            features: [
                {
                    icon: Database,
                    text: "Ejecuta scripts SQL en todas tus bases de datos al mismo tiempo",
                },
                {
                    icon: Server,
                    text: "Gestiona conexiones a múltiples servidores de forma centralizada",
                },
                {
                    icon: Zap,
                    text: "Automatiza la creación de tablas, funciones y extensiones",
                },
            ],
        },
    },
    {
        id: 3,
        title: "¿Qué más hace?",
        content: {
            main: "TenantForge ofrece control total sobre operaciones DDL y lógica avanzada exclusivamente para PostgreSQL.",
            features: [
                {
                    icon: Terminal,
                    text: "DDL Completo: CREATE / ALTER / DROP de tablas, esquemas e índices",
                },
                {
                    icon: Code2,
                    text: "Lógica: Soporte total para PL/pgSQL, funciones y procedimientos",
                },
                {
                    icon: Table,
                    text: "Vistas: Gestión de Vistas Normales y Materializadas con REFRESH",
                },
                {
                    icon: Activity,
                    text: "DML: Ejecución controlada de INSERT, UPDATE y DELETE",
                },
                {
                    icon: Filter,
                    text: "SELECT Restringido: Solo en subconsultas, Joins, CTEs o Vistas",
                },
                {
                    icon: CheckCircle2,
                    text: "Extensiones: Soporte nativo para CREATE EXTENSION",
                },
            ],
        },
    },
    {
        id: 4,
        title: "Proyectos y Seguridad",
        content: {
            main: "Diseñado para manejar múltiples entornos con una arquitectura de acceso seguro.",
            features: [
                {
                    icon: LayoutGrid,
                    text: "Multi-Proyecto: Maneja múltiples proyectos y bases de datos al tiempo",
                },
                {
                    icon: ListChecks,
                    text: "Resumen: Detalle de cada operación ejecutada en cada una de las bases de datos",
                },
                {
                    icon: Database,
                    text: "Compatible exclusivamente (de momento) con PostgreSQL",
                },
            ],
        },
    },
    {
        id: 5,
        title: "¡Comienza ahora!",
        content: {
            main: "Simplifica la gestión de tus bases de datos. Comienza a usar TenantForge hoy mismo.",
            features: [
                {
                    icon: Play,
                    text: "Configuración rápida proyectada por .env",
                },
                {
                    icon: FileText,
                    text: "Carga tu configuración y empieza a ejecutar SQL",
                },
                {
                    icon: Zap,
                    text: "Potencia tu flujo de trabajo ahora",
                },
            ],
        },
    },
];
