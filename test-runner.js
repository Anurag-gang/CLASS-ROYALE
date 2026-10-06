const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const users = await prisma.user.findMany({ include: { profile: true } });
    console.log('USERS:', JSON.stringify(users.map(u => ({ id: u.id, username: u.username, email: u.email, hasProfile: !!u.profile }))));
    const convs = await prisma.cRConversation.findMany();
    console.log('CONVS COUNT:', convs.length);
  } catch (err) {
    console.error('ERROR in test:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
