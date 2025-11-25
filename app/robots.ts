import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/settings/", "/deploy/"],
    },
    sitemap: "https://aether-860155021919.us-central1.run.app/sitemap.xml",
  };
}
