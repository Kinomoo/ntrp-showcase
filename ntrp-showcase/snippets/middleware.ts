// 展示用途的擷取片段，非完整專案
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 佈署環境強制 HTTPS
  const isHttps =
    request.headers.get('x-forwarded-proto') === 'https' ||
    request.url.startsWith('https://')

  if (!isHttps && process.env.NODE_ENV === 'production') {
    const url = request.nextUrl.clone()
    url.protocol = 'https:'
    return NextResponse.redirect(url, 301)
  }

  // 安全標頭（與專案一致）
  const response = NextResponse.next()
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Download-Options', 'noopen')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')

  // CSRF 檢查位置
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
    const csrfToken = request.headers.get('x-csrf-token')
    const sessionToken =
      request.cookies.get('next-auth.session-token') ||
      request.cookies.get('__Secure-next-auth.session-token')

  }

  return response
}

// 排除 API 與靜態資源
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
