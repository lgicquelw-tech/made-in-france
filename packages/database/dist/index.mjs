// src/index.ts
export * from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { PrismaClient as PrismaClient2 } from "@prisma/client";
var globalForPrisma = globalThis;
var prisma = globalForPrisma.prisma ?? new PrismaClient2({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
});
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export {
  PrismaClient,
  prisma
};
//# sourceMappingURL=index.mjs.map