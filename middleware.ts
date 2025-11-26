export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/roadmaps/:path*",
    "/clients/:path*",
    "/workers/:path*",
    "/ai-solutions/:path*",
    "/library/:path*",
  ]
}




