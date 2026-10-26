import { authenticate } from "../shopify.server";

const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
    },
  });

export async function loader({ request }) {
  // Shopify signs app proxy requests. Do not accept an arbitrary shop parameter.
  const { admin } = await authenticate.public.appProxy(request);
  if (!admin) return json({ error: "Shop authentication unavailable" }, 401);

  const url = new URL(request.url);
  const titleFilter = (url.searchParams.get("title") || "")
    .replace(/["\\]/g, "")
    .trim();
  const search = titleFilter
    ? `status:draft title:*${titleFilter}*`
    : "status:draft";
  const result = await admin.graphql(
    `#graphql
      query DraftPreviewProducts($search: String!) {
        products(first: 100, query: $search) {
          nodes {
            id
            title
            handle
            description
            featuredImage { url altText }
            priceRangeV2 { minVariantPrice { amount currencyCode } }
            variants(first: 100) {
              nodes { id title availableForSale price sku }
            }
          }
        }
      }`,
    { variables: { search } },
  );

  const body = await result.json();
  if (!result.ok || body.errors?.length || !body.data?.products) {
    return json({ error: "Unable to load draft products" }, 502);
  }
  return json({
    products: body.data.products.nodes,
  });
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  return json({ error: "Method not allowed" }, 405);
}
