import {
  Database,
  Server,
  Zap,
  CheckCircle2,
  Clock,
  Shield,
  Users,
  Play,
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
    title: "¿Qué hace TenantForge?",
    content: {
      main: "TenantForge es una herramienta diseñada para simplificar las migraciones de bases de datos en entornos multi-tenant.",
      features: [
        {
          icon: Database,
          text: "Ejecuta el mismo script SQL en múltiples bases de datos",
        },
        {
          icon: Server,
          text: "Gestiona conexiones a diferentes servidores simultáneamente",
        },
        {
          icon: Zap,
          text: "Automatiza procesos de migración de forma sencilla",
        },
      ],
    },
  },
  {
    id: 2,
    title: "¿Qué más hace?",
    content: {
      main: "Más allá de las migraciones básicas, TenantForge ofrece capacidades avanzadas para tu equipo.",
      features: [
        {
          icon: Clock,
          text: "Programa migraciones para ejecutarse en horarios específicos",
        },
        {
          icon: Shield,
          text: "Validación y rollback automático en caso de errores",
        },
        {
          icon: Users,
          text: "Gestión de permisos y auditoría de cambios",
        },
      ],
    },
  },
  {
    id: 3,
    title: "Ventajas",
    content: {
      main: "Descubre por qué TenantForge es la solución ideal para tu empresa.",
      features: [
        {
          icon: CheckCircle2,
          text: "Ahorra tiempo ejecutando migraciones en paralelo",
        },
        {
          icon: CheckCircle2,
          text: "Reduce errores humanos con procesos automatizados",
        },
        {
          icon: CheckCircle2,
          text: "Interfaz intuitiva diseñada para uso interno",
        },
      ],
    },
  },
  {
    id: 4,
    title: "¡Comienza ahora!",
    content: {
      main: "Estás listo para simplificar tus migraciones. Comienza a usar TenantForge hoy mismo.",
      features: [
        {
          icon: Play,
          text: "Configuración rápida y sencilla",
        },
        {
          icon: Database,
          text: "Conecta tus servidores en minutos",
        },
        {
          icon: Zap,
          text: "Ejecuta tu primera migración ahora",
        },
      ],
    },
  },
];

