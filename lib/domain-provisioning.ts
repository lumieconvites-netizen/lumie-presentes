import { prisma } from '@/lib/prisma';
import {
  addDomainToProject,
  buyRegistrarDomain,
  getProjectDomain,
  getRegistrarOrder,
  isRegistrarPurchaseConfigured,
  prepareRegistrarRegistration,
} from '@/lib/domain-registrars';

function truncateMessage(value: string, max = 220) {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || 'Erro desconhecido.');
}

export async function syncCustomDomainProvisioning(customDomainId: string) {
  const customDomainSelect = {
    id: true,
    userId: true,
    giftListId: true,
    domain: true,
    status: true,
    registrarOrderId: true,
    registrarOrderStatus: true,
    purchaseAttemptedAt: true,
    projectDomainVerifiedAt: true,
    availabilityCheckedAt: true,
    registeredAt: true,
    expiresAt: true,
    lastError: true,
    createdAt: true,
  } as const;

  const customDomain = await prisma.customDomain.findUnique({
    where: { id: customDomainId },
    select: customDomainSelect,
  });

  if (!customDomain) return null;
  if (customDomain.status === 'ACTIVE' || customDomain.status === 'EXPIRED') return customDomain;

  let registrarOrderId = customDomain.registrarOrderId;

  if (!registrarOrderId) {
    const preparation = await prepareRegistrarRegistration({
      domain: customDomain.domain,
      userId: customDomain.userId,
      giftListId: customDomain.giftListId,
    });

    if (!preparation.ok) {
      return prisma.customDomain.update({
        where: { id: customDomain.id },
        data: {
          status: 'FAILED',
          lastError: truncateMessage(preparation.message),
        },
        select: customDomainSelect,
      });
    }

    if (!isRegistrarPurchaseConfigured()) {
      return prisma.customDomain.update({
        where: { id: customDomain.id },
        data: {
          status: 'PURCHASE_PENDING',
          lastError: truncateMessage(preparation.message),
        },
        select: customDomainSelect,
      });
    }

    let purchase: Awaited<ReturnType<typeof buyRegistrarDomain>>;
    try {
      purchase = await buyRegistrarDomain(customDomain.domain, 1);
    } catch (error) {
      return prisma.customDomain.update({
        where: { id: customDomain.id },
        data: {
          status: 'PURCHASE_PENDING',
          registrarOrderStatus: 'purchase_failed',
          purchaseAttemptedAt: new Date(),
          lastError: truncateMessage(getErrorMessage(error)),
        },
        select: customDomainSelect,
      });
    }

    registrarOrderId = String(purchase?.orderId || '').trim() || null;

    await prisma.customDomain.update({
      where: { id: customDomain.id },
      data: {
        registrarOrderId,
        registrarOrderStatus: 'purchasing',
        purchaseAttemptedAt: new Date(),
        status: 'PURCHASE_PENDING',
        lastError: null,
      },
      select: customDomainSelect,
    });
  }

  if (!registrarOrderId) {
    return prisma.customDomain.update({
      where: { id: customDomain.id },
      data: {
        status: 'FAILED',
        lastError: 'Nao foi possivel obter o pedido de compra do dominio.',
      },
      select: customDomainSelect,
    });
  }

  const order = await getRegistrarOrder(registrarOrderId);
  const orderStatus = String(order?.status || '').toLowerCase();
  const domainOrder = Array.isArray(order?.domains) ? order.domains[0] : null;
  const domainStatus = String(domainOrder?.status || '').toLowerCase();

  if (orderStatus === 'failed' || domainStatus === 'failed') {
    return prisma.customDomain.update({
      where: { id: customDomain.id },
      data: {
        status: 'FAILED',
        registrarOrderStatus: orderStatus || domainStatus,
        lastError: truncateMessage(
          String(domainOrder?.error?.code || order?.error?.code || 'Falha ao comprar dominio no registrador.')
        ),
      },
      select: customDomainSelect,
    });
  }

  if (orderStatus !== 'completed') {
    return prisma.customDomain.update({
      where: { id: customDomain.id },
      data: {
        status: 'PURCHASE_PENDING',
        registrarOrderStatus: orderStatus || domainStatus || 'pending',
        lastError: null,
      },
      select: customDomainSelect,
    });
  }

  const projectDomain = await addDomainToProject(customDomain.domain);
  const verified = Boolean(projectDomain?.verified);

  if (!verified) {
    const currentProjectDomain = await getProjectDomain(customDomain.domain);
    if (currentProjectDomain?.verified) {
      return prisma.customDomain.update({
        where: { id: customDomain.id },
        data: {
          status: 'ACTIVE',
          registrarOrderStatus: orderStatus,
          registeredAt: customDomain.registeredAt ?? new Date(),
          projectDomainVerifiedAt: new Date(),
          lastError: null,
        },
        select: customDomainSelect,
      });
    }

    return prisma.customDomain.update({
      where: { id: customDomain.id },
      data: {
        status: 'PURCHASE_PENDING',
        registrarOrderStatus: orderStatus,
        registeredAt: customDomain.registeredAt ?? new Date(),
        lastError: 'Dominio comprado. Aguardando confirmacao final no projeto Vercel.',
      },
      select: customDomainSelect,
    });
  }

  return prisma.customDomain.update({
    where: { id: customDomain.id },
    data: {
      status: 'ACTIVE',
      registrarOrderStatus: orderStatus,
      registeredAt: customDomain.registeredAt ?? new Date(),
      projectDomainVerifiedAt: new Date(),
      lastError: null,
    },
    select: customDomainSelect,
  });
}
