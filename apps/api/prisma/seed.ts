import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@cin.ufpe.br' },
    update: {},
    create: {
      email: 'test@cin.ufpe.br',
      name: 'User Teste',
      role: 'STUDENT',
    },
  });

  console.log('Seed user created:', user.name);

  // Create some listings
  const listings = [
    {
      title: 'Monitor 24" Dell',
      description: 'Monitor em ótimo estado, usado por 1 ano.',
      price: 800.0,
      category: 'SALE',
      authorId: user.id,
    },
    {
      title: 'Livro de Algoritmos - Cormen',
      description: 'Capa dura, sem marcações.',
      price: 150.0,
      category: 'SALE',
      authorId: user.id,
    },
    {
      title: 'Chave de Carro Perdida',
      description: 'Encontrada no bloco A, chave de um VW.',
      price: null,
      category: 'LOST_FOUND',
      authorId: user.id,
    },
    {
      title: 'Grupo de Estudo Cálculo 1',
      description: 'Buscando pessoas para estudar para a prova final.',
      price: null,
      category: 'ACADEMIC',
      authorId: user.id,
    },
  ];

  for (const listing of listings) {
    await prisma.listing.create({
      data: listing,
    });
  }

  console.log('Seed listings created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
