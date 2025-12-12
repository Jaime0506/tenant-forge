/**
 * Función para formatear SQL básico
 */
export function formatSql(sql: string): string {
    let formatted = sql
        .replace(/\s+/g, " ")
        .replace(/\s*,\s*/g, ", ")
        .replace(/\s*\(\s*/g, " (")
        .replace(/\s*\)\s*/g, ") ")
        .trim();

    // Agregar saltos de línea después de palabras clave importantes
    const keywordsWithNewline = [
        "SELECT",
        "FROM",
        "WHERE",
        "JOIN",
        "ORDER BY",
        "GROUP BY",
        "HAVING",
        "INSERT",
        "UPDATE",
        "DELETE",
    ];

    keywordsWithNewline.forEach((keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, "gi");
        formatted = formatted.replace(regex, `\n${keyword}`);
    });

    formatted = formatted.replace(/\n\n+/g, "\n").trim();
    return formatted;
}
