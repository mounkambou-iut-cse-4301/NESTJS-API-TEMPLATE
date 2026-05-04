// prisma/scripts/seed-superadmin.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function splitFullName(fullName) {
  const cleanName = String(fullName || '').trim();

  if (!cleanName) {
    return {
      firstName: 'Super',
      lastName: 'Administrateur',
    };
  }

  const parts = cleanName.split(/\s+/);

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: 'Administrateur',
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

async function main() {
  const email = (process.env.SUPERADMIN_EMAIL || 'superadmin@collect-femme.com').trim();
  const phone = (process.env.SUPERADMIN_PHONE || '+237692473511').trim();
  const password = process.env.SUPERADMIN_PASSWORD || '1234';

  const fullName = process.env.SUPERADMIN_NAME || 'Super Administrateur';

  const firstNameEnv = process.env.SUPERADMIN_FIRST_NAME;
  const lastNameEnv = process.env.SUPERADMIN_LAST_NAME;

  const nameParts = splitFullName(fullName);

  const firstName = (firstNameEnv || nameParts.firstName).trim();
  const lastName = (lastNameEnv || nameParts.lastName).trim();

  console.log('🚀 Démarrage du seed SUPERADMIN...');
  console.log(`📧 Email: ${email}`);
  console.log(`📱 Téléphone: ${phone}`);
  console.log(`👤 Nom: ${firstName} ${lastName}`);

  // 1) Créer le rôle SUPERADMIN s'il n'existe pas
  let role = await prisma.role.findUnique({
    where: {
      name: 'SUPERADMIN',
    },
  });

  if (!role) {
    console.log('📌 Création du rôle SUPERADMIN...');

    role = await prisma.role.create({
      data: {
        name: 'SUPERADMIN',
        description: 'Super administrateur de la plateforme',
      },
    });

    console.log(`✅ Rôle SUPERADMIN créé (id: ${role.id})`);
  } else {
    console.log(`✅ Rôle SUPERADMIN déjà existant (id: ${role.id})`);
  }

  // 2) Rechercher un utilisateur existant par email ou téléphone
  const existingUserByEmail = await prisma.utilisateur.findFirst({
    where: {
      email: {
        equals: email,
        mode: 'insensitive',
      },
    },
  });

  const existingUserByPhone = await prisma.utilisateur.findUnique({
    where: {
      phone,
    },
  });

  if (
    existingUserByEmail &&
    existingUserByPhone &&
    existingUserByEmail.id !== existingUserByPhone.id
  ) {
    throw new Error(
      `Conflit détecté : l'email ${email} appartient à l'utilisateur ${existingUserByEmail.id}, mais le téléphone ${phone} appartient à l'utilisateur ${existingUserByPhone.id}.`,
    );
  }

  const existingUser = existingUserByEmail || existingUserByPhone;

  const hashedPassword = await bcrypt.hash(password, 10);

  let user;

  // 3) Créer ou mettre à jour le SUPERADMIN
  if (existingUser) {
    console.log(`📌 Utilisateur existant trouvé (id: ${existingUser.id})`);

    user = await prisma.utilisateur.update({
      where: {
        id: existingUser.id,
      },
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        isVerified: true,
        isBlock: false,
        isDeleted: false,
        loginAttempt: 0,
      },
    });

    console.log(`🔄 SUPERADMIN mis à jour (id: ${user.id})`);
  } else {
    console.log('📌 Création du SUPERADMIN...');

    user = await prisma.utilisateur.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        isVerified: true,
        isBlock: false,
        isDeleted: false,
        loginAttempt: 0,
      },
    });

    console.log(`✅ SUPERADMIN créé (id: ${user.id})`);
  }

  // 4) Assigner le rôle SUPERADMIN à l'utilisateur
  await prisma.utilisateurRole.upsert({
    where: {
      utilisateurId_roleId: {
        utilisateurId: user.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      utilisateurId: user.id,
      roleId: role.id,
    },
  });

  console.log('\n✅ ====================================');
  console.log('🎉 SUPERADMIN PRÊT À ÊTRE UTILISÉ');
  console.log('====================================');
  console.log(`🆔 ID: ${user.id}`);
  console.log(`👤 Nom: ${user.firstName} ${user.lastName}`);
  console.log(`📧 Email: ${user.email}`);
  console.log(`📱 Téléphone: ${user.phone}`);
  console.log(`🔑 Mot de passe: ${password}`);
  console.log(`🎭 Rôle: ${role.name}`);
  console.log('====================================\n');
}

main()
  .catch((error) => {
    console.error('❌ Erreur seed-superadmin:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });