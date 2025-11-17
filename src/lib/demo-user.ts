import { prisma } from "./prisma";

interface DemoUserOptions {
  email?: string;
  name?: string;
}

export async function getOrCreateDemoUser(options: DemoUserOptions = {}) {
  const email = options.email ?? "demo@dais.app";
  const name = options.name ?? "DAiS Demo";

  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (existing) {
    return existing;
  }

  return prisma.user.create({
    data: {
      email,
      password: "changeme",
      name,
      role: "admin"
    }
  });
}
