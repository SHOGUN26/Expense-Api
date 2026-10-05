import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module.js";

let app: INestApplication;
const api = () => request(app.getHttpServer());

let cookieA: string;
let cookieB: string;
let firstExpense: any; // première dépense de A (création + isolation)

function toCookie(res: request.Response): string | undefined {
  const raw = res.headers["set-cookie"] as unknown as string[] | undefined;
  return raw?.map((c) => c.split(";")[0]).join("; ");
}

// Inscrit un utilisateur et renvoie son cookie de session
async function createUser(name: string): Promise<string> {
  const email = `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`;
  const password = "password12345678";

  const signup = await api()
    .post("/api/auth/sign-up/email")
    .send({ email, password, name });
  expect(signup.status, JSON.stringify(signup.body)).toBe(200);

  // L'inscription connecte déjà l'utilisateur. Login seulement en secours.
  const cookie = toCookie(signup);
  if (cookie) return cookie;

  const login = await api().post("/api/auth/sign-in/email").send({ email, password });
  expect(login.status, JSON.stringify(login.body)).toBe(200);
  return toCookie(login) as string;
}

beforeAll(async () => {
  app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ZodValidationPipe());
  await app.init();

  cookieA = await createUser("userA");
  cookieB = await createUser("userB");

  // Jeu de données de A : 4 dépenses variées
  const seed = [
    { label: "Dépense de A", amount: 10, category: "food", date: "2026-09-15T12:00:00.000Z" },
    { label: "Food octobre", amount: 20, category: "food", date: "2026-10-05T12:00:00.000Z" },
    { label: "Facture 31", amount: 30, category: "bills", date: "2026-10-31T18:00:00.000Z" },
    { label: "Transport", amount: 40, category: "transport", date: "2026-10-20T12:00:00.000Z" },
  ];

  for (const [i, d] of seed.entries()) {
    const res = await api().post("/expenses").set("Cookie", cookieA).send(d);
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    if (i === 0) firstExpense = res.body;
  }
});

afterAll(async () => {
  await app?.close();
});

describe("POST /expenses", () => {
  it("création valide → 201 avec les bons champs", () => {
    expect(firstExpense.id).toBeTypeOf("string");
    expect(firstExpense.label).toBe("Dépense de A");
    expect(Number(firstExpense.amount)).toBe(10);
    expect(firstExpense.category).toBe("food");
  });

  it("montant négatif → 400", async () => {
    const res = await api()
      .post("/expenses")
      .set("Cookie", cookieA)
      .send({ label: "Test", amount: -5, category: "food" });
    expect(res.status).toBe(400);
  });

  it("libellé vide → 400", async () => {
    const res = await api()
      .post("/expenses")
      .set("Cookie", cookieA)
      .send({ label: "", amount: 10, category: "food" });
    expect(res.status).toBe(400);
  });
});

describe("Accès sans session → 401", () => {
  it.each([
    ["post", "/expenses"],
    ["get", "/expenses"],
    ["get", "/expenses/summary"],
  ] as const)("%s %s", async (method, url) => {
    const res = await api()[method](url);
    expect(res.status).toBe(401);
  });
});

describe("GET /expenses (filtres)", () => {
  it("par catégorie", async () => {
    const res = await api().get("/expenses?category=food").set("Cookie", cookieA);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    for (const e of res.body) expect(e.category).toBe("food");
  });

  it("par période (to inclusif)", async () => {
    const res = await api()
      .get("/expenses?from=2026-10-01&to=2026-10-31")
      .set("Cookie", cookieA);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3); // septembre exclu, le 31 à 18h inclus
  });

  it("catégorie + période", async () => {
    const res = await api()
      .get("/expenses?category=food&from=2026-10-01&to=2026-10-31")
      .set("Cookie", cookieA);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].label).toBe("Food octobre");
  });

  it("catégorie invalide → 400", async () => {
    const res = await api().get("/expenses?category=nimportequoi").set("Cookie", cookieA);
    expect(res.status).toBe(400);
  });

  it("date invalide → 400", async () => {
    const res = await api().get("/expenses?from=pas-une-date").set("Cookie", cookieA);
    expect(res.status).toBe(400);
  });
});

describe("GET /expenses/summary", () => {
  it("total par catégorie correct", async () => {
    const res = await api().get("/expenses/summary").set("Cookie", cookieA);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeCloseTo(100, 2);

    const get = (cat: string) => res.body.byCategory.find((c: any) => c.category === cat);
    expect(get("food")).toMatchObject({ count: 2, total: 30 });
    expect(get("bills")).toMatchObject({ count: 1, total: 30 });
    expect(get("transport")).toMatchObject({ count: 1, total: 40 });
  });
});

describe("Isolation entre utilisateurs (A crée, B tente)", () => {
  it("B ne peut pas lire la dépense de A → 404", async () => {
    const res = await api().get(`/expenses/${firstExpense.id}`).set("Cookie", cookieB);
    expect(res.status).toBe(404);
  });

  it("B ne peut pas modifier la dépense de A → 404", async () => {
    const res = await api()
      .patch(`/expenses/${firstExpense.id}`) // .put si tu passes à PUT
      .set("Cookie", cookieB)
      .send({ label: "Piratée" });
    expect(res.status).toBe(404);
  });

  it("B ne peut pas supprimer la dépense de A → 404", async () => {
    const res = await api().delete(`/expenses/${firstExpense.id}`).set("Cookie", cookieB);
    expect(res.status).toBe(404);
  });

  it("B ne voit rien dans sa liste ni son résumé", async () => {
    const list = await api().get("/expenses").set("Cookie", cookieB);
    expect(list.body).toEqual([]);

    const summary = await api().get("/expenses/summary").set("Cookie", cookieB);
    expect(summary.body).toEqual({ total: 0, byCategory: [] });
  });

  it("la dépense de A est intacte", async () => {
    const res = await api().get(`/expenses/${firstExpense.id}`).set("Cookie", cookieA);
    expect(res.status).toBe(200);
    expect(res.body.label).toBe("Dépense de A");
  });
});