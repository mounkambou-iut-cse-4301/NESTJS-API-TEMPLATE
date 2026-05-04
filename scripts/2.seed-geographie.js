// prisma/scripts/seed-geographie.js

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Le fichier JSON doit être dans le même dossier que ce script.
const DEFAULT_JSON_PATH = path.join(__dirname, 'geographie-cameroun.json');

function normalizeName(value) {
  if (value === null || value === undefined) return null;

  const cleaned = String(value)
    .trim()
    .replace(/\s+/g, ' ');

  if (!cleaned) return null;

  // Tous les noms sont enregistrés en MAJUSCULES dans la base.
  return cleaned.toLocaleUpperCase('fr-FR');
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier JSON introuvable : ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf8');

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`JSON invalide dans ${filePath} : ${error.message}`);
  }
}

async function upsertRegion(regionData) {
  const name = normalizeName(regionData.name_fr);
  const nameEn = normalizeName(regionData.name_en);

  if (!name) {
    throw new Error('Région invalide : name_fr est obligatoire.');
  }

  return prisma.region.upsert({
    where: {
      name,
    },
    update: {
      nameEn,
    },
    create: {
      name,
      nameEn,
    },
  });
}

async function upsertDepartement(regionId, divisionData) {
  const name = normalizeName(divisionData.name_fr);
  const nameEn = normalizeName(divisionData.name_en);

  if (!name) {
    throw new Error('Département invalide : name_fr est obligatoire.');
  }

  return prisma.departement.upsert({
    where: {
      regionId_name: {
        regionId,
        name,
      },
    },
    update: {
      nameEn,
    },
    create: {
      name,
      nameEn,
      regionId,
    },
  });
}

async function upsertArrodissement(departementId, councilData) {
  const name = normalizeName(councilData.name_fr);
  const nameEn = normalizeName(councilData.name_en);

  if (!name) {
    throw new Error('Arrondissement invalide : name_fr est obligatoire.');
  }

  return prisma.arrodissement.upsert({
    where: {
      departementId_name: {
        departementId,
        name,
      },
    },
    update: {
      nameEn,
    },
    create: {
      name,
      nameEn,
      departementId,
    },
  });
}

async function main() {
  const jsonPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : DEFAULT_JSON_PATH;

  console.log('🚀 Démarrage du seed géographique...');
  console.log(`📄 Fichier utilisé : ${jsonPath}`);

  const data = readJsonFile(jsonPath);

  let regionCount = 0;
  let departementCount = 0;
  let arrodissementCount = 0;

  for (const [regionKey, regionData] of Object.entries(data)) {
    if (!regionData || typeof regionData !== 'object') {
      console.warn(`⚠️ Région ignorée : ${regionKey}`);
      continue;
    }

    const region = await upsertRegion(regionData);
    regionCount++;

    console.log(`\n✅ RÉGION : ${region.name} / ${region.nameEn || '-'}`);

    const divisions = regionData.divisions || {};

    for (const [divisionKey, divisionData] of Object.entries(divisions)) {
      if (!divisionData || typeof divisionData !== 'object') {
        console.warn(`  ⚠️ Département ignoré : ${divisionKey}`);
        continue;
      }

      const departement = await upsertDepartement(region.id, divisionData);
      departementCount++;

      console.log(
        `  ✅ DÉPARTEMENT : ${departement.name} / ${departement.nameEn || '-'}`,
      );

      const councils = Array.isArray(divisionData.councils)
        ? divisionData.councils
        : [];

      for (const councilData of councils) {
        if (!councilData || typeof councilData !== 'object') {
          console.warn(`    ⚠️ Arrondissement ignoré dans ${departement.name}`);
          continue;
        }

        const arrodissement = await upsertArrodissement(
          departement.id,
          councilData,
        );

        arrodissementCount++;

        console.log(
          `    ✅ ARRONDISSEMENT : ${arrodissement.name} / ${arrodissement.nameEn || '-'}`,
        );
      }
    }
  }

  console.log('\n✅ ====================================');
  console.log('🎉 SEED GÉOGRAPHIQUE TERMINÉ');
  console.log('====================================');
  console.log(`🌍 RÉGIONS TRAITÉES : ${regionCount}`);
  console.log(`🏛️ DÉPARTEMENTS TRAITÉS : ${departementCount}`);
  console.log(`📍 ARRONDISSEMENTS TRAITÉS : ${arrodissementCount}`);
  console.log('====================================\n');
}

main()
  .catch((error) => {
    console.error('❌ Erreur seed-geographie:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });