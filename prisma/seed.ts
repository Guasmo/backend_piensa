import { PrismaClient, Prisma, Role } from '@prisma/client'; // <-- ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ ASÍ
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Empezando el sembrado de datos básicos...');

  // 1. Limpiar datos existentes
  await prisma.history.deleteMany();
  await prisma.energyMeasurement.deleteMany();
  await prisma.usageSession.deleteMany();
  await prisma.userspeaker.deleteMany();
  await prisma.user.deleteMany();
  await prisma.speaker.deleteMany();

  console.log('🧹 Base de datos limpiada.');

  // 2. Crear Usuarios
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash('password123', salt);

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      phone: '+15550001111',
      password: hashedPassword,
      role: Role.ADMIN, // <-- USO CORRECTO
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      username: 'juanperez',
      email: 'juan.perez@example.com',
      phone: '+593991234567',
      password: hashedPassword,
      role: Role.USER, // <-- USO CORRECTO
    },
  });

  console.log(`👤 Creados usuarios: ${adminUser.username} y ${regularUser.username}`);

  // ... (resto del archivo)
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });