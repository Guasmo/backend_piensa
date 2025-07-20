import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Inicializar Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando el proceso de seed...');

  // --- Crear Usuarios ---
  // Encriptar una contraseña de ejemplo
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('password123', saltRounds);

  // Crear usuario normal (ID = 1, para coincidir con el código de Arduino)
  const user1 = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      username: 'esp32_user',
      email: 'user@example.com',
      password: hashedPassword,
      role: Role.USER,
    },
  });
  console.log(`👤 Creado usuario normal: ${user1.username}`);

  // Crear usuario administrador
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: 2,
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`👑 Creado usuario administrador: ${adminUser.username}`);


  // --- Crear Parlantes ---
  // Crear parlante principal (ID = 1, para coincidir con el código de Arduino)
  const speaker1 = await prisma.speaker.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'JBL Principal',
      position: 'Sala de Estar',
      batteryPercentage: 100.0,
      state: false,
    },
  });
  console.log(`🔊 Creado parlante principal: ${speaker1.name}`);

  // Crear otro parlante de ejemplo
  const speaker2 = await prisma.speaker.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Sony Portátil',
      position: 'Cocina',
      batteryPercentage: 85.5,
      state: false,
    },
  });
  console.log(`🔊 Creado parlante secundario: ${speaker2.name}`);


  // --- Asignar Parlante a Usuario ---
  // Asegurarse de que no haya una asignación previa para evitar errores
  await prisma.userspeaker.deleteMany({
    where: {
      userId: user1.id,
      speakerId: speaker1.id,
    }
  });

  const assignment = await prisma.userspeaker.create({
    data: {
      userId: user1.id,
      speakerId: speaker1.id,
    },
  });
  console.log(`🔗 Asignado parlante '${speaker1.name}' a usuario '${user1.username}'`);
  

  console.log('✅ Seed completado exitosamente.');
}

// Ejecutar la función principal y manejar errores
main()
  .catch((e) => {
    console.error('❌ Error durante el proceso de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Cerrar la conexión con la base de datos
    await prisma.$disconnect();
  });