import { prisma } from "../lib/prisma";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error("Uso: npm run admin:promote -- email@dominio.com");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, name: true },
  });

  if (!user) {
    console.error(`Usuario nao encontrado: ${email}`);
    process.exit(1);
  }

  if (user.role === "ADMIN") {
    console.log(`Usuario ${email} ja e ADMIN.`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
  });

  console.log(`Usuario promovido para ADMIN: ${email}`);
}

main()
  .catch((error) => {
    console.error("Erro ao promover usuario:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
