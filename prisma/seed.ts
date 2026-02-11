import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Limpar templates existentes
  await prisma.template.deleteMany();

  // Templates de listas
  const templates = [
    {
      name: 'Casamento Clássico',
      slug: 'casamento-classico',
      description: 'Elegante e tradicional, perfeito para casamentos formais',
      category: 'casamento',
      thumbnail: '/templates/casamento-classico.jpg',
      isActive: true,
      order: 1,
      defaultTheme: {
        colors: {
          primary: '#C65A3A',
          secondary: '#8E3D2C',
          background: '#FAF4EF',
          text: '#2B2422',
        },
        fonts: {
          display: 'Playfair Display',
          body: 'Inter',
        },
      },
      defaultBlocks: [
        {
          id: 'hero-1',
          type: 'hero',
          order: 0,
          config: {
            title: 'Nosso Casamento',
            subtitle: 'Celebre conosco esse momento especial',
            backgroundImage: '',
            backgroundColor: '#C65A3A',
            textColor: '#FFFFFF',
            ctaText: 'Ver Presentes',
            ctaLink: '#presentes',
          },
        },
        {
          id: 'text-1',
          type: 'text',
          order: 1,
          config: {
            content: 'Queridos amigos e familiares, sua presença é o nosso maior presente! Mas se quiserem nos presentear, criamos esta lista especial para ajudar a realizar nossos sonhos.',
            backgroundColor: '#FFFFFF',
            textColor: '#2B2422',
            alignment: 'center',
          },
        },
        {
          id: 'gifts-1',
          type: 'giftList',
          order: 2,
          config: {
            title: 'Presentes',
            layout: 'grid',
            columns: 3,
            showDescription: true,
            backgroundColor: '#FAF4EF',
          },
        },
        {
          id: 'messages-1',
          type: 'messages',
          order: 3,
          config: {
            title: 'Recados dos Convidados',
            showPhotos: true,
            backgroundColor: '#FFFFFF',
          },
        },
        {
          id: 'footer-1',
          type: 'footer',
          order: 4,
          config: {
            text: 'Com amor',
            backgroundColor: '#8E3D2C',
            textColor: '#FFFFFF',
          },
        },
      ],
    },
    {
      name: 'Chá de Casa Nova',
      slug: 'cha-de-casa-nova',
      description: 'Aconchegante e moderno, ideal para o início de uma nova jornada',
      category: 'cha-casa',
      thumbnail: '/templates/cha-casa-nova.jpg',
      isActive: true,
      order: 2,
      defaultTheme: {
        colors: {
          primary: '#C65A3A',
          secondary: '#8E3D2C',
          background: '#F1E3D6',
          text: '#2B2422',
        },
        fonts: {
          display: 'Playfair Display',
          body: 'Inter',
        },
      },
      defaultBlocks: [
        {
          id: 'hero-1',
          type: 'hero',
          order: 0,
          config: {
            title: 'Nosso Lar Doce Lar',
            subtitle: 'Ajude-nos a construir nossa casa dos sonhos',
            backgroundImage: '',
            backgroundColor: '#C65A3A',
            textColor: '#FFFFFF',
          },
        },
        {
          id: 'gifts-1',
          type: 'giftList',
          order: 1,
          config: {
            title: 'O que precisamos',
            layout: 'grid',
            columns: 3,
            backgroundColor: '#F1E3D6',
          },
        },
        {
          id: 'footer-1',
          type: 'footer',
          order: 2,
          config: {
            text: 'Obrigado por fazer parte da nossa história',
            backgroundColor: '#8E3D2C',
            textColor: '#FFFFFF',
          },
        },
      ],
    },
    {
      name: 'Aniversário Elegante',
      slug: 'aniversario-elegante',
      description: 'Sofisticado e festivo, perfeito para celebrações especiais',
      category: 'aniversario',
      thumbnail: '/templates/aniversario-elegante.jpg',
      isActive: true,
      order: 3,
      defaultTheme: {
        colors: {
          primary: '#C65A3A',
          secondary: '#F3B40F',
          background: '#FAF4EF',
          text: '#2B2422',
        },
        fonts: {
          display: 'Playfair Display',
          body: 'Inter',
        },
      },
      defaultBlocks: [
        {
          id: 'hero-1',
          type: 'hero',
          order: 0,
          config: {
            title: 'Meu Aniversário',
            subtitle: 'Celebre comigo essa data especial',
            backgroundImage: '',
            backgroundColor: '#C65A3A',
            textColor: '#FFFFFF',
          },
        },
        {
          id: 'countdown-1',
          type: 'countdown',
          order: 1,
          config: {
            eventDate: '',
            backgroundColor: '#FFFFFF',
          },
        },
        {
          id: 'gifts-1',
          type: 'giftList',
          order: 2,
          config: {
            title: 'Lista de Desejos',
            layout: 'grid',
            columns: 3,
            backgroundColor: '#FAF4EF',
          },
        },
        {
          id: 'footer-1',
          type: 'footer',
          order: 3,
          config: {
            text: 'Obrigado por fazer parte da minha vida',
            backgroundColor: '#8E3D2C',
            textColor: '#FFFFFF',
          },
        },
      ],
    },
    {
      name: 'Batizado',
      slug: 'batizado',
      description: 'Delicado e puro, ideal para celebrar essa bênção',
      category: 'batizado',
      thumbnail: '/templates/batizado.jpg',
      isActive: true,
      order: 4,
      defaultTheme: {
        colors: {
          primary: '#C65A3A',
          secondary: '#F1E3D6',
          background: '#FFFFFF',
          text: '#2B2422',
        },
        fonts: {
          display: 'Playfair Display',
          body: 'Inter',
        },
      },
      defaultBlocks: [
        {
          id: 'hero-1',
          type: 'hero',
          order: 0,
          config: {
            title: 'Batizado',
            subtitle: 'Uma nova vida, uma nova bênção',
            backgroundImage: '',
            backgroundColor: '#F1E3D6',
            textColor: '#2B2422',
          },
        },
        {
          id: 'text-1',
          type: 'text',
          order: 1,
          config: {
            content: 'Agradecemos sua presença neste momento tão especial. Se desejarem nos presentear, preparamos esta lista com carinho.',
            backgroundColor: '#FFFFFF',
            textColor: '#2B2422',
            alignment: 'center',
          },
        },
        {
          id: 'gifts-1',
          type: 'giftList',
          order: 2,
          config: {
            title: 'Presentes',
            layout: 'grid',
            columns: 3,
            backgroundColor: '#FAF4EF',
          },
        },
        {
          id: 'footer-1',
          type: 'footer',
          order: 3,
          config: {
            text: 'Com gratidão',
            backgroundColor: '#C65A3A',
            textColor: '#FFFFFF',
          },
        },
      ],
    },
    {
      name: 'Minimal Terracota',
      slug: 'minimal-terracota',
      description: 'Limpo e minimalista, foco total nos presentes',
      category: 'minimalista',
      thumbnail: '/templates/minimal-terracota.jpg',
      isActive: true,
      order: 5,
      defaultTheme: {
        colors: {
          primary: '#C65A3A',
          secondary: '#8E3D2C',
          background: '#FFFFFF',
          text: '#2B2422',
        },
        fonts: {
          display: 'Playfair Display',
          body: 'Inter',
        },
      },
      defaultBlocks: [
        {
          id: 'hero-1',
          type: 'hero',
          order: 0,
          config: {
            title: 'Minha Lista',
            subtitle: 'Escolha um presente e ajude a realizar meus sonhos',
            backgroundImage: '',
            backgroundColor: '#FFFFFF',
            textColor: '#C65A3A',
          },
        },
        {
          id: 'gifts-1',
          type: 'giftList',
          order: 1,
          config: {
            title: '',
            layout: 'grid',
            columns: 4,
            backgroundColor: '#FFFFFF',
          },
        },
      ],
    },
  ];

  for (const template of templates) {
    await prisma.template.create({
      data: template,
    });
    console.log(`✅ Template criado: ${template.name}`);
  }

  console.log('✨ Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
