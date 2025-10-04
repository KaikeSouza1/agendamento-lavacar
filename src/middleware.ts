// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host');

  const ADMIN_DOMAIN = 'agendamento-lavacar.vercel.app';
  const GALLERY_DOMAIN = 'galeria-lavacar.vercel.app';

  // Em ambiente de desenvolvimento local, permite que tudo funcione normalmente
  if (hostname === 'localhost:3000') {
    return NextResponse.next();
  }

  // ### Lógica para o domínio da GALERIA ###
  if (hostname === GALLERY_DOMAIN) {
    // Se o caminho for da galeria, permite o acesso
    if (pathname.startsWith('/galeria')) {
      return NextResponse.next();
    }
    // Se for qualquer outro caminho (como a raiz '/'), redireciona para o painel admin
    return NextResponse.redirect(`https://${ADMIN_DOMAIN}`);
  }

  // ### Lógica para o domínio do ADMIN ###
  if (hostname === ADMIN_DOMAIN) {
    // Se alguém tentar acessar a galeria pelo domínio do admin, redireciona
    if (pathname.startsWith('/galeria')) {
      const url = new URL(request.url);
      url.hostname = GALLERY_DOMAIN;
      return NextResponse.redirect(url);
    }
    // Permite todos os outros acessos no domínio do admin
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Roda o middleware para todas as rotas, exceto arquivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|logobarber.png).*)',
  ],
};