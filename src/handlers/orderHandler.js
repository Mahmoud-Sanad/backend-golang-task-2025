const prisma = require("../prisma").payment;
const config = require("../config");
const { generateId } = require("../utils/idGenerator");

/**
 * Create an order and its items in a single transaction.
 * Expects data to contain optionally: userId and items: [{ productId, quantity }]
 */
const { sendSuccess } = require("../utils/routeUtils");

async function createOrder(req, res, wsManager) {
  const data = req.body || {};
  const items = Array.isArray(data.items) ? data.items : [];

  if (items.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  const productIds = [...new Set(
    items.map((item) => String(item.productId))
  )];

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds
      }
    }
  });

  const productsById = new Map(
    products.map((product) => [
      String(product.id),
      product
    ])
  );

  for (const item of items) {
    const productId = String(item.productId);

    if (!productsById.has(productId)) {
      throw new Error(`Product not found: ${productId}`);
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error(
        `Invalid quantity for product ${productId}`
      );
    }
  }

  const total = items.reduce((sum, item) => {
    const product = productsById.get(
      String(item.productId)
    );

    return (
      sum +
      Number(product.price) * item.quantity
    );
  }, 0);

  const orderId =
    data.id || generateId(config.serverId);

  const userId =
    req.auth?.userId || data.userId || null;

  const result = await prisma.$transaction(
    async (tx) => {
      const order = await tx.order.create({
        data: {
          id: orderId,
          userId,
          total
        }
      });

      const createdItems = [];

      for (const item of items) {
        const productId = String(item.productId);
        const product = productsById.get(productId);

        if (product.trackStock) {
          const stockUpdate =
            await tx.productStock.updateMany({
              where: {
                productId,
                quantity: {
                  gte: item.quantity
                }
              },
              data: {
                quantity: {
                  decrement: item.quantity
                }
              }
            });

          if (stockUpdate.count !== 1) {
            throw new Error(
              `Insufficient stock for product ${productId}`
            );
          }
        }

        const createdItem =
          await tx.orderItem.create({
            data: {
              id: generateId(config.serverId),
              orderId: order.id,
              productId,
              quantity: item.quantity,
              price: product.price
            }
          });

        createdItems.push(createdItem);
      }

      return {
        order,
        items: createdItems
      };
    }
  );

  /*
   * Publish only after the transaction commits successfully.
   */
  if (wsManager) {
    wsManager.publishAdminNotification(
      "ORDER_CREATED",
      {
        orderId: result.order.id,
        userId: result.order.userId,
        total: result.order.total,
        status: result.order.status,
        itemsCount: result.items.length,
        createdAt: result.order.createdAt
      }
    );
  }

  return sendSuccess(res, result);
}

async function listOrders(req, res) {
  const result = await prisma.order.findMany();
  return sendSuccess(res, result);
}

async function getMyOrders(req, res) {
  const userId = req.auth?.userId || req.body.userId || null;
  const result = await prisma.order.findMany({ where: { userId } });
  return sendSuccess(res, result);
}

async function getOrder(req, res) {
  const id = req.params.id;
  const result = await prisma.order.findUnique({ where: { id: String(id) } });
  return sendSuccess(res, result);
}

async function updateOrder(req, res) {
  const id = req.params.id;
  const data = req.body || {};
  const result = await prisma.order.update({ where: { id: String(id) }, data });
  return sendSuccess(res, result);
}

async function deleteOrder(req, res) {
  const id = req.params.id;
  const result = await prisma.order.delete({ where: { id: String(id) } });
  return sendSuccess(res, result);
}

async function cancelOrder(req, res,wsManager) {
  const id = req.params.id;
  const auth = req.auth || {};

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: String(id) } });
    if (!order) throw new Error('Order not found');
    if (order.status !== 'PENDING') throw new Error('Only pending orders can be cancelled');
    if (auth.userId !== order.userId && auth.role !== 'ADMIN') throw new Error('Access denied');

    const items = await tx.orderItem.findMany({ where: { orderId: order.id } });

    // update order status
    await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });

    // restock: update single productStock row quantity, or create if missing
    for (const it of items) {
      const stockRow = await tx.productStock.findFirst({ where: { productId: it.productId } });
      if (stockRow) {
        await tx.productStock.update({ where: { id: stockRow.id }, data: { quantity: Number(stockRow.quantity) + Number(it.quantity) } });
      } else {
        const stockId = generateId(config.serverId);
        await tx.productStock.create({ data: { id: stockId, productId: it.productId, quantity: it.quantity } });
      }
    }

    return { success: true };
  });

  if (wsManager) {
    wsManager.publishAdminNotification(
      "ORDER_CANCELED",
      {
        orderId: id,
        userId: auth.userId,
        canceledAt: new Date().toISOString()
      }
    );
  }

  return sendSuccess(res, result);
}

async function getOrderStatus(req, res) {
  const id = req.params.id;
  const order = await prisma.order.findUnique({ where: { id: String(id) } });
  if (!order) throw new Error('Order not found');
  return sendSuccess(res, { id: order.id, status: order.status });
}

async function updateOrderStatus(req, res, wsManager) {
  const id = req.params.id;
  const { status } = req.body || {};
  if (!status) throw new Error('Missing status');
  const order = await prisma.order.update({ where: { id: String(id) }, data: { status } , include: { orderItems: true } });
  const serverId = order.userId.split("_")[0];
  
  if (wsManager) {
    try {
      wsManager.sendNotificationToRemoteUser(
        serverId,
        order.userId,
        "ORDER_STATUS_UPDATED",
        {
          orderId: order.id,
          total: order.total,
          status: order.status,
          itemsCount: order.orderItems.length,
          createdAt: order.createdAt
        }
      );
    } catch (error) {
      console.log(`Warning: Could not notify remote user ${order.userId}: ${error.message}`);
    }
  }
  return sendSuccess(res, order);
}

async function dailyReport(req, res) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const orders = await prisma.order.findMany({ where: { createdAt: { gte: today, lt: tomorrow } } });
  const totalSales = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  return sendSuccess(res, { date: today.toISOString().slice(0,10), totalSales, ordersCount: orders.length });
}

module.exports = {
  createOrder,
  listOrders,
  getMyOrders,
  getOrder,
  updateOrder,
  deleteOrder,
  cancelOrder,
  getOrderStatus,
  updateOrderStatus,
  dailyReport
};
