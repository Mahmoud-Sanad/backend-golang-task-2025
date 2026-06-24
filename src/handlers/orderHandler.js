const prisma = require("../prisma").payment;
const config = require("../config");
const { generateId } = require("../utils/idGenerator");

/**
 * Create an order and its items in a single transaction.
 * Expects data to contain optionally: userId and items: [{ productId, quantity }]
 */
const { sendSuccess } = require("../utils/routeUtils");

async function createOrder(req, res) {
  const data = req.body || {};
  const items = Array.isArray(data.items) ? data.items : [];

  // fetch product details for price lookup
  const productIds = items.map((it) => it.productId);
  const products = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } } })
    : [];

  const productsById = new Map(products.map((p) => [p.id, p]));

  // validate all products exist
  for (const it of items) {
    if (!productsById.has(it.productId)) {
      throw new Error(`Product not found: ${it.productId}`);
    }
    if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
      throw new Error(`Invalid quantity for product ${it.productId}`);
    }
  }

  // compute total from product prices
  const total = items.reduce((sum, it) => {
    const p = productsById.get(it.productId);
    return sum + (Number(p.price) || 0) * Number(it.quantity);
  }, 0);

  const orderId = data.id || generateId(config.serverId);

  // run transaction: create order then all orderItems
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        id: orderId,
        userId: data.userId || null,
        total,
      }
    });

    const createdItems = [];
    for (const it of items) {
      const prod = productsById.get(it.productId);
      const itemId = generateId(config.serverId);
      // single stock entry per product (find one)
      if (prod.trackStock){
        const stockRow = await tx.productStock.findFirst({ where: { productId: it.productId } });
        if (!stockRow || Number(stockRow.quantity) < Number(it.quantity)) {
          throw new Error(`Insufficient stock for product ${it.productId}`);
        }
        const newQty = Number(stockRow.quantity) - Number(it.quantity);
        await tx.productStock.update({ where: { id: stockRow.id }, data: { quantity: newQty } });
      }
      const created = await tx.orderItem.create({
        data: {
          id: itemId,
          orderId: order.id,
          productId: it.productId,
          quantity: it.quantity,
          price: prod.price
        }
      });
      createdItems.push(created);
    }

    return { order, items: createdItems };
  });

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

async function cancelOrder(req, res) {
  const id = req.params.id;
  const auth = req.auth || {};

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: String(id) } });
    if (!order) throw new Error('Order not found');
    if (order.status !== 'PENDING') throw new Error('Only pending orders can be cancelled');
    if (auth.userId !== order.userId && auth.role !== 'ADMIN') throw new Error('Access denied');

    const items = await tx.orderItem.findMany({ where: { orderId: order.id } });

    // update order status
    await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELED' } });

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

  return sendSuccess(res, result);
}

async function getOrderStatus(req, res) {
  const id = req.params.id;
  const order = await prisma.order.findUnique({ where: { id: String(id) } });
  if (!order) throw new Error('Order not found');
  return sendSuccess(res, { id: order.id, status: order.status });
}

async function updateOrderStatus(req, res) {
  const id = req.params.id;
  const { status } = req.body || {};
  if (!status) throw new Error('Missing status');
  const order = await prisma.order.update({ where: { id: String(id) }, data: { status } });
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
