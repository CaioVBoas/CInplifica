import {
  ModerationActionType,
  NotificationType,
  PrismaClient,
  ReportStatus,
  ReportTargetType,
} from '@prisma/client';

const prisma = new PrismaClient();

const ids = {
  users: {
    test: 'seed-user-test',
    maria: 'seed-user-maria',
    joao: 'seed-user-joao',
    carla: 'seed-user-carla',
    admin: 'seed-user-admin',
  },
  listings: {
    monitor: 'seed-listing-monitor',
    cormen: 'seed-listing-cormen',
    calculator: 'seed-listing-calculator',
    keychain: 'seed-listing-keychain',
    bottle: 'seed-listing-bottle',
    calculus: 'seed-listing-calculus',
    summaries: 'seed-listing-summaries',
  },
  conversations: {
    monitor: 'seed-conversation-monitor',
    calculator: 'seed-conversation-calculator',
    calculus: 'seed-conversation-calculus',
  },
  messages: {
    monitor1: 'seed-message-monitor-1',
    monitor2: 'seed-message-monitor-2',
    calculator1: 'seed-message-calculator-1',
    calculator2: 'seed-message-calculator-2',
    calculus1: 'seed-message-calculus-1',
  },
  reports: {
    cormen: 'seed-report-cormen',
    message: 'seed-report-message',
    resolved: 'seed-report-resolved',
  },
  moderationActions: {
    rejectMessage: 'seed-moderation-reject-message',
    approveResolved: 'seed-moderation-approve-resolved',
  },
  auditLogs: {
    seed: 'seed-audit-log-seed',
    moderation: 'seed-audit-log-moderation',
  },
  notifications: {
    message: 'seed-notification-message',
    interest: 'seed-notification-interest',
  },
};

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

async function seedUsers() {
  const users = [
    {
      id: ids.users.test,
      email: 'test@cin.ufpe.br',
      name: 'User Teste',
      role: 'STUDENT',
      status: 'ACTIVE',
      picture: '/logo.png',
    },
    {
      id: ids.users.maria,
      email: 'maria.silva@cin.ufpe.br',
      name: 'Maria Silva',
      role: 'STUDENT',
      status: 'ACTIVE',
      picture: null,
    },
    {
      id: ids.users.joao,
      email: 'joao.souza@cin.ufpe.br',
      name: 'João Souza',
      role: 'STUDENT',
      status: 'ACTIVE',
      picture: null,
    },
    {
      id: ids.users.carla,
      email: 'carla.melo@cin.ufpe.br',
      name: 'Carla Melo',
      role: 'STUDENT',
      status: 'ACTIVE',
      picture: null,
    },
    {
      id: ids.users.admin,
      email: 'admin@cin.ufpe.br',
      name: 'Admin CIn',
      role: 'ADMIN',
      status: 'ACTIVE',
      picture: '/logo.png',
    },
  ];

  return Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          role: user.role,
          status: user.status,
          suspendedAt: null,
          picture: user.picture,
        },
        create: user,
      })
    )
  );
}

async function seedListings(authorIds: Record<string, string>) {
  const listings = [
    {
      id: ids.listings.monitor,
      title: 'Monitor Dell 24 polegadas',
      description: 'Monitor em ótimo estado, com cabo HDMI e fonte. Retirada no CIn.',
      price: 850,
      category: 'SALE',
      status: 'ACTIVE',
      imageUrl: '/logo.png',
      authorId: authorIds.maria,
      createdAt: daysAgo(1),
    },
    {
      id: ids.listings.cormen,
      title: 'Livro de Algoritmos - Cormen',
      description: 'Capa dura, sem marcações e bem conservado.',
      price: 150,
      category: 'SALE',
      status: 'ACTIVE',
      imageUrl: null,
      authorId: authorIds.joao,
      createdAt: daysAgo(2),
    },
    {
      id: ids.listings.calculator,
      title: 'Calculadora HP 12C',
      description: 'Calculadora financeira funcionando, com capa original.',
      price: 220,
      category: 'SALE',
      status: 'SOLD',
      imageUrl: null,
      authorId: authorIds.joao,
      createdAt: daysAgo(10),
    },
    {
      id: ids.listings.keychain,
      title: 'Chaveiro encontrado no bloco A',
      description: 'Chaveiro azul encontrado perto da secretaria. Está com a portaria.',
      price: null,
      category: 'LOST_FOUND',
      status: 'ACTIVE',
      imageUrl: null,
      authorId: authorIds.carla,
      lostFoundLocation: 'Bloco A',
      lostFoundOccurredAt: daysAgo(1),
      lostFoundStatus: 'FOUND',
      createdAt: daysAgo(1),
    },
    {
      id: ids.listings.bottle,
      title: 'Garrafa térmica perdida',
      description: 'Garrafa preta com adesivo do CIn, perdida no anfiteatro.',
      price: null,
      category: 'LOST_FOUND',
      status: 'RETURNED',
      imageUrl: null,
      authorId: authorIds.test,
      lostFoundLocation: 'Anfiteatro',
      lostFoundOccurredAt: daysAgo(5),
      lostFoundStatus: 'RETURNED',
      createdAt: daysAgo(5),
    },
    {
      id: ids.listings.calculus,
      title: 'Grupo de estudo de Cálculo 1',
      description: 'Encontros semanais para resolver listas e revisar para a prova.',
      price: null,
      category: 'ACADEMIC',
      status: 'ACTIVE',
      imageUrl: null,
      isFree: true,
      authorId: authorIds.carla,
      academicSubject: 'Cálculo 1',
      academicProfessor: 'Prof. Roberto',
      academicTerm: '2026.1',
      academicExternalLink: 'https://cin.ufpe.br',
      createdAt: daysAgo(3),
    },
    {
      id: ids.listings.summaries,
      title: 'Resumos de Engenharia de Software',
      description: 'Material colaborativo com mapas mentais e exercícios resolvidos.',
      price: null,
      category: 'ACADEMIC',
      status: 'ACTIVE',
      imageUrl: null,
      isFree: true,
      authorId: authorIds.maria,
      academicSubject: 'Engenharia de Software',
      academicProfessor: 'Prof. Ana',
      academicTerm: '2026.1',
      academicExternalLink: 'https://cin.ufpe.br',
      createdAt: daysAgo(4),
    },
  ];

  return Promise.all(
    listings.map((listing) =>
      prisma.listing.upsert({
        where: { id: listing.id },
        update: listing,
        create: listing,
      })
    )
  );
}

async function upsertConversation(data: {
  id: string;
  listingId: string;
  userIds: string[];
  status?: string;
  completedAt?: Date | null;
  completedById?: string | null;
}) {
  const completedBy = data.completedById
    ? { connect: { id: data.completedById } }
    : undefined;

  return prisma.conversation.upsert({
    where: { id: data.id },
    update: {
      status: data.status || 'OPEN',
      completedAt: data.completedAt ?? null,
      completedBy: completedBy || { disconnect: true },
      listing: { connect: { id: data.listingId } },
      users: { set: data.userIds.map((id) => ({ id })) },
    },
    create: {
      id: data.id,
      status: data.status || 'OPEN',
      completedAt: data.completedAt ?? null,
      completedBy,
      listing: { connect: { id: data.listingId } },
      users: { connect: data.userIds.map((id) => ({ id })) },
    },
  });
}

async function seedConversations(userIds: Record<string, string>) {
  const monitorConversation = await upsertConversation({
    id: ids.conversations.monitor,
    listingId: ids.listings.monitor,
    userIds: [userIds.test, userIds.maria],
  });

  const calculatorConversation = await upsertConversation({
    id: ids.conversations.calculator,
    listingId: ids.listings.calculator,
    userIds: [userIds.test, userIds.joao],
    status: 'COMPLETED',
    completedAt: daysAgo(7),
    completedById: userIds.test,
  });

  const calculusConversation = await upsertConversation({
    id: ids.conversations.calculus,
    listingId: ids.listings.calculus,
    userIds: [userIds.test, userIds.carla],
  });

  const messages = [
    {
      id: ids.messages.monitor1,
      text: 'Oi, o monitor ainda está disponível?',
      senderId: userIds.test,
      conversationId: monitorConversation.id,
      createdAt: daysAgo(1),
    },
    {
      id: ids.messages.monitor2,
      text: 'Está sim. Posso levar amanhã para o CIn.',
      senderId: userIds.maria,
      conversationId: monitorConversation.id,
      createdAt: daysAgo(1),
    },
    {
      id: ids.messages.calculator1,
      text: 'Fechado, vou ficar com a calculadora.',
      senderId: userIds.test,
      conversationId: calculatorConversation.id,
      createdAt: daysAgo(8),
    },
    {
      id: ids.messages.calculator2,
      text: 'Perfeito, entrega concluída.',
      senderId: userIds.joao,
      conversationId: calculatorConversation.id,
      createdAt: daysAgo(7),
    },
    {
      id: ids.messages.calculus1,
      text: 'Posso entrar no grupo de estudo?',
      senderId: userIds.test,
      conversationId: calculusConversation.id,
      createdAt: daysAgo(2),
    },
  ];

  await Promise.all(
    messages.map((message) =>
      prisma.message.upsert({
        where: { id: message.id },
        update: message,
        create: message,
      })
    )
  );

  await prisma.messageRead.upsert({
    where: {
      messageId_userId: {
        messageId: ids.messages.monitor1,
        userId: userIds.maria,
      },
    },
    update: { readAt: daysAgo(1) },
    create: {
      messageId: ids.messages.monitor1,
      userId: userIds.maria,
      readAt: daysAgo(1),
    },
  });

  await prisma.review.upsert({
    where: {
      reviewerId_conversationId_reviewedUserId: {
        reviewerId: userIds.test,
        conversationId: calculatorConversation.id,
        reviewedUserId: userIds.joao,
      },
    },
    update: {
      rating: 5,
      comment: 'Entrega rápida e produto exatamente como anunciado.',
      listingId: ids.listings.calculator,
    },
    create: {
      rating: 5,
      comment: 'Entrega rápida e produto exatamente como anunciado.',
      reviewerId: userIds.test,
      reviewedUserId: userIds.joao,
      conversationId: calculatorConversation.id,
      listingId: ids.listings.calculator,
    },
  });

  await prisma.review.upsert({
    where: {
      reviewerId_conversationId_reviewedUserId: {
        reviewerId: userIds.joao,
        conversationId: calculatorConversation.id,
        reviewedUserId: userIds.test,
      },
    },
    update: {
      rating: 5,
      comment: 'Negociação tranquila.',
      listingId: ids.listings.calculator,
    },
    create: {
      rating: 5,
      comment: 'Negociação tranquila.',
      reviewerId: userIds.joao,
      reviewedUserId: userIds.test,
      conversationId: calculatorConversation.id,
      listingId: ids.listings.calculator,
    },
  });
}

async function seedNotifications(userIds: Record<string, string>) {
  await prisma.interestKeyword.upsert({
    where: {
      userId_keyword: {
        userId: userIds.test,
        keyword: 'monitor',
      },
    },
    update: {},
    create: {
      userId: userIds.test,
      keyword: 'monitor',
    },
  });

  await prisma.interestKeyword.upsert({
    where: {
      userId_keyword: {
        userId: userIds.test,
        keyword: 'cálculo',
      },
    },
    update: {},
    create: {
      userId: userIds.test,
      keyword: 'cálculo',
    },
  });

  await prisma.notification.upsert({
    where: { id: ids.notifications.message },
    update: {
      type: NotificationType.MESSAGE,
      title: 'Nova mensagem',
      body: 'Maria respondeu sobre o monitor.',
      link: '/chat',
      readAt: null,
      userId: userIds.test,
    },
    create: {
      id: ids.notifications.message,
      type: NotificationType.MESSAGE,
      title: 'Nova mensagem',
      body: 'Maria respondeu sobre o monitor.',
      link: '/chat',
      userId: userIds.test,
    },
  });

  await prisma.notification.upsert({
    where: { id: ids.notifications.interest },
    update: {
      type: NotificationType.INTEREST_ALERT,
      title: 'Novo anúncio compatível',
      body: 'Encontramos um anúncio com a palavra monitor.',
      link: `/listings/${ids.listings.monitor}`,
      readAt: null,
      userId: userIds.test,
    },
    create: {
      id: ids.notifications.interest,
      type: NotificationType.INTEREST_ALERT,
      title: 'Novo anúncio compatível',
      body: 'Encontramos um anúncio com a palavra monitor.',
      link: `/listings/${ids.listings.monitor}`,
      userId: userIds.test,
    },
  });
}

async function seedModeration(userIds: Record<string, string>) {
  await prisma.report.upsert({
    where: { id: ids.reports.cormen },
    update: {
      targetType: ReportTargetType.LISTING,
      targetId: ids.listings.cormen,
      reason: 'Preço suspeito',
      description: 'Usuário reportou que o preço parece inconsistente com o anúncio.',
      status: ReportStatus.PENDING,
      reporterId: userIds.test,
    },
    create: {
      id: ids.reports.cormen,
      targetType: ReportTargetType.LISTING,
      targetId: ids.listings.cormen,
      reason: 'Preço suspeito',
      description: 'Usuário reportou que o preço parece inconsistente com o anúncio.',
      status: ReportStatus.PENDING,
      reporterId: userIds.test,
    },
  });

  await prisma.report.upsert({
    where: { id: ids.reports.message },
    update: {
      targetType: ReportTargetType.MESSAGE,
      targetId: ids.messages.calculus1,
      reason: 'Mensagem indevida',
      description: 'Denúncia usada para testar fluxo de rejeição.',
      status: ReportStatus.DISMISSED,
      reporterId: userIds.carla,
    },
    create: {
      id: ids.reports.message,
      targetType: ReportTargetType.MESSAGE,
      targetId: ids.messages.calculus1,
      reason: 'Mensagem indevida',
      description: 'Denúncia usada para testar fluxo de rejeição.',
      status: ReportStatus.DISMISSED,
      reporterId: userIds.carla,
    },
  });

  await prisma.report.upsert({
    where: { id: ids.reports.resolved },
    update: {
      targetType: ReportTargetType.LISTING,
      targetId: ids.listings.bottle,
      reason: 'Anúncio duplicado',
      description: 'Denúncia já resolvida para popular histórico.',
      status: ReportStatus.RESOLVED,
      reporterId: userIds.maria,
    },
    create: {
      id: ids.reports.resolved,
      targetType: ReportTargetType.LISTING,
      targetId: ids.listings.bottle,
      reason: 'Anúncio duplicado',
      description: 'Denúncia já resolvida para popular histórico.',
      status: ReportStatus.RESOLVED,
      reporterId: userIds.maria,
    },
  });

  await prisma.moderationAction.upsert({
    where: { id: ids.moderationActions.rejectMessage },
    update: {
      action: ModerationActionType.REJECT_REPORT,
      reportId: ids.reports.message,
      targetType: ReportTargetType.MESSAGE,
      targetId: ids.messages.calculus1,
      reason: 'Conteúdo dentro das regras.',
      moderatorId: userIds.admin,
    },
    create: {
      id: ids.moderationActions.rejectMessage,
      action: ModerationActionType.REJECT_REPORT,
      reportId: ids.reports.message,
      targetType: ReportTargetType.MESSAGE,
      targetId: ids.messages.calculus1,
      reason: 'Conteúdo dentro das regras.',
      moderatorId: userIds.admin,
    },
  });

  await prisma.moderationAction.upsert({
    where: { id: ids.moderationActions.approveResolved },
    update: {
      action: ModerationActionType.APPROVE_REPORT,
      reportId: ids.reports.resolved,
      targetType: ReportTargetType.LISTING,
      targetId: ids.listings.bottle,
      reason: 'Histórico de exemplo.',
      moderatorId: userIds.admin,
    },
    create: {
      id: ids.moderationActions.approveResolved,
      action: ModerationActionType.APPROVE_REPORT,
      reportId: ids.reports.resolved,
      targetType: ReportTargetType.LISTING,
      targetId: ids.listings.bottle,
      reason: 'Histórico de exemplo.',
      moderatorId: userIds.admin,
    },
  });

  await prisma.auditLog.upsert({
    where: { id: ids.auditLogs.seed },
    update: {
      action: 'DEV_SEED_RUN',
      entityType: 'Database',
      entityId: 'local-dev',
      actorId: userIds.admin,
      metadata: { source: 'prisma/seed.ts' },
    },
    create: {
      id: ids.auditLogs.seed,
      action: 'DEV_SEED_RUN',
      entityType: 'Database',
      entityId: 'local-dev',
      actorId: userIds.admin,
      metadata: { source: 'prisma/seed.ts' },
    },
  });

  await prisma.auditLog.upsert({
    where: { id: ids.auditLogs.moderation },
    update: {
      action: 'REPORT_REJECTED',
      entityType: 'Report',
      entityId: ids.reports.message,
      actorId: userIds.admin,
      metadata: { targetType: ReportTargetType.MESSAGE, targetId: ids.messages.calculus1 },
    },
    create: {
      id: ids.auditLogs.moderation,
      action: 'REPORT_REJECTED',
      entityType: 'Report',
      entityId: ids.reports.message,
      actorId: userIds.admin,
      metadata: { targetType: ReportTargetType.MESSAGE, targetId: ids.messages.calculus1 },
    },
  });
}

async function main() {
  const users = await seedUsers();
  const userIds = {
    test: users.find((user) => user.email === 'test@cin.ufpe.br')!.id,
    maria: users.find((user) => user.email === 'maria.silva@cin.ufpe.br')!.id,
    joao: users.find((user) => user.email === 'joao.souza@cin.ufpe.br')!.id,
    carla: users.find((user) => user.email === 'carla.melo@cin.ufpe.br')!.id,
    admin: users.find((user) => user.email === 'admin@cin.ufpe.br')!.id,
  };

  await seedListings(userIds);
  await seedConversations(userIds);
  await seedNotifications(userIds);
  await seedModeration(userIds);

  console.log('Seed de desenvolvimento concluído.');
  console.table([
    { perfil: 'Aluno padrão', email: 'test@cin.ufpe.br' },
    { perfil: 'Admin', email: 'admin@cin.ufpe.br' },
    { perfil: 'Vendedor 1', email: 'maria.silva@cin.ufpe.br' },
    { perfil: 'Vendedor 2', email: 'joao.souza@cin.ufpe.br' },
    { perfil: 'Acadêmico', email: 'carla.melo@cin.ufpe.br' },
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
