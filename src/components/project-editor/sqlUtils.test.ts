import { describe, expect, it } from "vitest";
import { analyzeSql, splitStatements, stripSqlLiterals } from "./sqlUtils";

describe("stripSqlLiterals", () => {
    it("elimina strings, comentarios y dollar quotes", () => {
        const out = stripSqlLiterals(
            "SELECT 'DROP TABLE x;' -- DROP\n/* TRUNCATE */ , $fn$ DELETE FROM t; $fn$, \"a;b\""
        );
        expect(out).not.toMatch(/DROP|TRUNCATE|DELETE|;/);
    });

    it("respeta E'' con escapes", () => {
        expect(stripSqlLiterals("SELECT E'it\\'s; DROP'")).not.toContain("DROP");
    });

    it("no confunde $1 con dollar quoting", () => {
        expect(splitStatements("SELECT $1; SELECT 2")).toHaveLength(2);
    });
});

describe("analyzeSql", () => {
    it("detecta operaciones destructivas", () => {
        const kinds = (sql: string) => analyzeSql(sql).destructive.map((d) => d.kind);
        expect(kinds("DROP TABLE users")).toEqual(["DROP"]);
        expect(kinds("truncate logs")).toEqual(["TRUNCATE"]);
        expect(kinds("DELETE FROM users")).toEqual(["DELETE_ALL"]);
        expect(kinds("UPDATE users SET a = 1")).toEqual(["UPDATE_ALL"]);
        expect(kinds("ALTER TABLE users DROP COLUMN email")).toEqual(["ALTER_DROP"]);
    });

    it("no marca sentencias seguras", () => {
        expect(analyzeSql("DELETE FROM users WHERE id = 1").destructive).toEqual([]);
        expect(analyzeSql("UPDATE users SET a = 1 WHERE b").destructive).toEqual([]);
        expect(analyzeSql("INSERT INTO t VALUES ('DROP TABLE x')").destructive).toEqual([]);
        expect(
            analyzeSql("CREATE FUNCTION f() RETURNS void AS $$ BEGIN DELETE FROM t; END $$ LANGUAGE plpgsql")
                .destructive
        ).toEqual([]);
    });

    it("detecta scripts de solo lectura", () => {
        expect(analyzeSql("SELECT 1; SHOW search_path").readOnly).toBe(true);
        expect(analyzeSql("SELECT * INTO copia FROM t").readOnly).toBe(false);
        expect(analyzeSql("WITH d AS (DELETE FROM t RETURNING *) SELECT * FROM d").readOnly).toBe(false);
        expect(analyzeSql("").readOnly).toBe(false);
    });
});
