import { NextResponse } from "next/server"

/**
 * GET /api/health
 * Comprueba que la API está activa. No requiere auth.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    status: "ok",
    time: Date.now(),
  })
}
