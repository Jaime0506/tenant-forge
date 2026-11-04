import { describe, expect, it } from "vitest";
import { cleanQuotes, getUniqueConnections, serializeEnvConnections } from "./envParser";

const EXAMPLE = `
# Tenant 1
POSTGRES_TYPE_TENANT_1="postgres"
POSTGRES_HOST_TENANT_1="localhost"
POSTGRES_DB_TENANT_1="tenant_forge_1"
POSTGRES_USER_TENANT_1="admin"
POSTGRES_PASSWORD_TENANT_1="admin123"
POSTGRES_PORT_TENANT_1=5432

# Tenant 2
POSTGRES_HOST_TENANT_2='db.prod'
POSTGRES_DB_TENANT_2=tenant_forge_2
POSTGRES_USER_TENANT_2=admin
POSTGRES_PASSWORD_TENANT_2="p ss'w"
POSTGRES_SSLMODE_TENANT_2=REQUIRE
POSTGRES_GROUP_TENANT_2=prod
`;

describe("cleanQuotes", () => {
    it("quita comillas ASCII y tipográficas anidadas", () => {
        expect(cleanQuotes(`"'valor'"`)).toBe("valor");
        expect(cleanQuotes("“valor”")).toBe("valor");
        expect(cleanQuotes("‘valor’")).toBe("valor");
        expect(cleanQuotes("  sin comillas ")).toBe("sin comillas");
        expect(cleanQuotes(undefined)).toBeUndefined();
        expect(cleanQuotes(5432)).toBe("5432");
    });

    it("no toca comillas internas", () => {
        expect(cleanQuotes(`"p ss'w"`)).toBe("p ss'w");
    });
});

describe("getUniqueConnections", () => {
    it("parsea bloques con todos los campos", () => {
        const conns = getUniqueConnections(EXAMPLE);
        expect(conns).toHaveLength(2);
        expect(conns[0]).toMatchObject({
            id: "tenant_forge_1",
            envKey: "TENANT_1",
            host: "localhost",
            port: 5432,
            password: "admin123",
        });
        expect(conns[1]).toMatchObject({
            id: "tenant_forge_2",
            host: "db.prod",
            password: "p ss'w",
            sslmode: "require",
            group: "prod",
        });
    });

    it("separa conexiones con sufijos distintos aunque no haya línea en blanco", () => {
        const conns = getUniqueConnections(
            "POSTGRES_DB_A=a\nPOSTGRES_USER_A=u\nPOSTGRES_DB_B=b\nPOSTGRES_USER_B=u"
        );
        expect(conns.map((c) => c.id)).toEqual(["a", "b"]);
    });

    it("desambigua la misma DB en distintos puertos y schemas", () => {
        const conns = getUniqueConnections(
            [
                "POSTGRES_DB_X=app\nPOSTGRES_PORT_X=5432",
                "POSTGRES_DB_X=app\nPOSTGRES_PORT_X=5433",
                "POSTGRES_DB_Y=app\nPOSTGRES_SCHEMA_Y=tenant_a\nPOSTGRES_PORT_Y=5432",
            ].join("\n\n")
        );
        const ids = conns.map((c) => c.id);
        expect(new Set(ids).size).toBe(3);
        expect(ids[0]).toBe("app_5432");
        expect(ids[1]).toBe("app_5433");
    });

    it("ignora comentarios y líneas que no son de conexión", () => {
        const conns = getUniqueConnections("# POSTGRES_DB_A=x\nOTHER=1\nPOSTGRES_DB_A=real");
        expect(conns).toHaveLength(1);
        expect(conns[0].db).toBe("real");
    });
});

describe("serializeEnvConnections", () => {
    it("ida y vuelta conserva los datos", () => {
        const conns = getUniqueConnections(EXAMPLE);
        const again = getUniqueConnections(serializeEnvConnections(conns));
        expect(again).toEqual(conns);
    });
});
