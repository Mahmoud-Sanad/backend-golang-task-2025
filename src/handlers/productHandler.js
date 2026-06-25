const prisma = require("../prisma").payment;
const config = require("../config");
const { generateId } = require("../utils/idGenerator");
const { sendSuccess } = require("../utils/routeUtils");
const productCache = require("../services/productCache");

async function createProduct(req, res) {
  const data = req.body || {};
  const id =
    data.id || generateId(config.serverId);

  const createdBy =
    req.auth?.userId || null;

  const result = await prisma.product.create({
    data: {
      ...data,
      id,
      createdBy
    }
  });

  /*
   * The product was just created, so add it to the cache.
   */
  productCache.put(result.id, result);

  return sendSuccess(res, result);
}

async function listProducts(req, res) {
  const page = Math.max(
    1,
    Number(req.query.page) || 1
  );

  const limit = Math.max(
    1,
    Math.min(
      100,
      Number(req.query.limit) || 20
    )
  );

  const skip = (page - 1) * limit;
  const where = {};

  const [total, items] = await Promise.all([
    prisma.product.count({
      where
    }),

    prisma.product.findMany({
      where,
      skip,
      take: limit
    })
  ]);

  /*
   * Warm the individual-product cache with products
   * already returned by the database.
   */
  for (const product of items) {
    productCache.put(product.id, product);
  }

  return sendSuccess(res, {
    items,
    meta: {
      total,
      page,
      limit
    }
  });
}

async function getProduct(req, res) {
  const id = String(req.params.id);

  /*
   * Cache hit:
   * returns immediately.
   *
   * Cache miss:
   * automatically loads from Prisma.
   */
  const result = await productCache.get(id);

  return sendSuccess(res, result);
}

async function updateProduct(req, res) {
  const id = String(req.params.id);
  const data = {
    ...(req.body || {})
  };

  /*
   * Do not allow the request body to modify the ID.
   */
  delete data.id;

  const result = await prisma.product.update({
    where: {
      id
    },
    data
  });

  /*
   * Replace the stale cached product with the updated one.
   */
  productCache.put(id, result);

  return sendSuccess(res, result);
}

async function deleteProduct(req, res) {
  const id = String(req.params.id);

  const result = await prisma.$transaction(
    async (tx) => {
      await tx.orderItem.deleteMany({
        where: {
          productId: id
        }
      });

      await tx.productStock.deleteMany({
        where: {
          productId: id
        }
      });

      return tx.product.delete({
        where: {
          id
        }
      });
    }
  );

  /*
   * Invalidate only after the database transaction commits.
   */
  productCache.invalidate(id);

  return sendSuccess(res, result);
}

function getProductCacheStats(req, res) {
  return sendSuccess(
    res,
    productCache.stats()
  );
}

function clearProductCache(req, res) {
  productCache.invalidateAll();

  return sendSuccess(res, {
    cleared: true
  });
}

module.exports = {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductCacheStats,
  clearProductCache
};