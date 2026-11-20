import { DatabaseService } from '../src/database/database.service';
import { seedEnterpriseData } from '../src/database/seed-data';

async function main() {
  const db = new DatabaseService();
  try {
    await db.connect();
    await db.runMigrations();
    await seedEnterpriseData(db);
    console.log('Seed complete. Demo logins: admin@demo.local / Demo1234! • manager@demo.local / Demo1234!');
  } finally {
    await db.onModuleDestroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
