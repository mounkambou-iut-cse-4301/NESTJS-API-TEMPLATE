// prisma/scripts/seed-superadmin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Configuration via .env ou valeurs par défaut
  const email = (process.env.SUPERADMIN_EMAIL || 'superadmin@dezoumay.com').trim();
  const phone = (process.env.SUPERADMIN_PHONE || '+237692473511').trim();
  const password = process.env.SUPERADMIN_PASSWORD || '1234';
  const nom = process.env.SUPERADMIN_NOM || 'Super Administrateur';
  const genre = process.env.SUPERADMIN_GENRE || 'M';

  console.log('🚀 Démarrage du seed SUPERADMIN...');
  console.log(`📧 Email: ${email}`);
  console.log(`📱 Téléphone: ${phone}`);

  // 1) Vérifier si le rôle SUPERADMIN existe, sinon le créer
  let role = await prisma.role.findFirst({
    where: {
      nom: {
        in: ['SUPERADMIN', 'SUPER_ADMIN']
      }
    }
  });

  if (!role) {
    console.log('📌 Création du rôle SUPERADMIN...');
    role = await prisma.role.create({
      data: {
        nom: 'SUPERADMIN',
      },
    });
  } else {
    console.log(`✅ Rôle SUPERADMIN trouvé (id: ${role.id})`);
  }

  // 2) Vérifier si les permissions existent
  const existingPermissions = await prisma.permission.findMany();
  if (existingPermissions.length === 0) {
    console.log('📌 Création des permissions de base...');
    const permissions = [
      { code: 'user:create' },
      { code: 'user:read' },
      { code: 'user:update' },
      { code: 'user:delete' },
      { code: 'user:block' },
      { code: 'role:manage' },
      { code: 'setting:manage' },
      { code: 'reservation:manage' },
      { code: 'transaction:manage' },
    ];
    
    for (const perm of permissions) {
      await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: perm,
      });
    }
    
    // Assigner toutes les permissions au rôle SUPERADMIN
    const allPermissions = await prisma.permission.findMany();
    for (const perm of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: perm.id,
        },
      });
    }
    console.log(`✅ ${allPermissions.length} permissions assignées au rôle SUPERADMIN`);
  }

  // 3) Chercher l'utilisateur existant
  let user = await prisma.utilisateur.findFirst({
    where: {
      OR: [
        { email: { equals: email, mode: 'insensitive' } },
        { telephone: phone },
      ],
    },
  });

  const hashedPassword = await bcrypt.hash(password, 10);

  if (user) {
    console.log(`📌 Utilisateur existant trouvé (id: ${user.id})`);
    // Mettre à jour l'utilisateur existant
    user = await prisma.utilisateur.update({
      where: { id: user.id },
      data: {
        nom,
        email,
        telephone: phone,
        mot_de_passe: hashedPassword,
        type: 'SUPERADMIN',
        is_verified: true,
        is_block: false,
        genre: genre === 'M' ? 'M' : 'F',
        nombre_attempts: 0,
      },
    });
    console.log(`🔄 Utilisateur mis à jour (id: ${user.id})`);
  } else {
    console.log('📌 Création du SUPERADMIN...');
    user = await prisma.utilisateur.create({
      data: {
        nom,
        email,
        telephone: phone,
        mot_de_passe: hashedPassword,
        type: 'SUPERADMIN',
        is_verified: true,
        is_block: false,
        genre: genre === 'M' ? 'M' : 'F',
        nombre_attempts: 0,
      },
    });
    console.log(`✅ SUPERADMIN créé (id: ${user.id})`);
  }

  // 4) Assigner le rôle (idempotent)
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
  console.log(`👤 Nom: ${user.nom}`);
  console.log(`📧 Email: ${user.email}`);
  console.log(`📱 Téléphone: ${user.telephone}`);
  console.log(`🔑 Mot de passe: ${password}`);
  console.log(`🎭 Rôle: ${role.nom}`);
  console.log('====================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed-superadmin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });