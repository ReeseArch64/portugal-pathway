import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  const existingAdmin = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  const hashedPassword = await bcrypt.hash("admin", 10);
  const now = new Date();

  if (existingAdmin) {
    console.log("⚠️  Usuário admin já existe. Atualizando senha...");

    await prisma.$runCommandRaw({
      update: "users",
      updates: [
        {
          q: { username: "admin" },
          u: {
            $set: {
              password: hashedPassword,
              fullName: "Administrador",
              role: "ADMIN",
              resetPassword: true,
              updatedAt: { $date: now.toISOString() },
            },
          },
        },
      ],
    });

    console.log("✅ Usuário admin atualizado com sucesso!");
    console.log(`   Username: admin`);
    console.log(`   Nome: Administrador`);
    console.log(`   Role: ADMIN`);
    return;
  }

  await prisma.$runCommandRaw({
    insert: "users",
    documents: [
      {
        username: "admin",
        password: hashedPassword,
        fullName: "Administrador",
        role: "ADMIN",
        resetPassword: true,
        createdAt: { $date: now.toISOString() },
        updatedAt: { $date: now.toISOString() },
      },
    ],
  });

  console.log("✅ Usuário admin criado com sucesso!");
  console.log(`   Username: admin`);
  console.log(`   Nome: Administrador`);
  console.log(`   Role: ADMIN`);
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
