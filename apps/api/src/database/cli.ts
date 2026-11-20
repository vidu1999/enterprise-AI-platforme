import { DatabaseService } from './database.service';
import { seedEnterpriseData } from './seed-data';

async function main() {
  const command = process.argv[2] ?? 'migrate';
  const db = new DatabaseService();
  try {
    await db.connect();
    await db.runMigrations();
    if (command === 'seed') {
      await seedEnterpriseData(db);
      console.log('Seed complete. Demo logins: admin@demo.local / Demo1234! • manager@demo.local / Demo1234! • tech@demo.local / Demo1234! • viewer@demo.local / Demo1234!');
    } else {
      console.log('Migrations applied successfully.');
    }
  } finally {
    await db.onModuleDestroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
