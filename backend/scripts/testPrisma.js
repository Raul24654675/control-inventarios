require('dotenv').config();
console.log('DATABASE_URL=', process.env.DATABASE_URL);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$connect().then(()=>{console.log('conectó');process.exit(0);}).catch(err=>{console.error('error details', err); process.exit(1);});
