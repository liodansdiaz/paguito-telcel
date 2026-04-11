import 'dotenv/config';
import { prisma } from '../src/config/database';

async function main() {
  try {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { clave: 'asc' },
    });
    
    console.log('Registros en system_config:', configs.length);
    console.log(JSON.stringify(configs, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
