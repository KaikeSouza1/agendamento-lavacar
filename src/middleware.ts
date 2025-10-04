// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host');

  const ADMIN_DOMAIN = 'agendamento-lavacar.vercel.app';
  const GALLERY_DOMAIN = 'galeria-lavacar.vercel.app';

  // Em ambiente local, não faz nada
  if (hostname === 'localhost:3000') {
    return NextResponse.next();
  }

  // Lógica para o domínio da GALERIA
  if (hostname === GALLERY_DOMAIN) {
    // Se o caminho começa com /galeria, permite o acesso.
    if (pathname.startsWith('/galeria')) {
      return NextResponse.next();
    }
    // Para QUALQUER outro caminho (ex: '/', '/servicos'), retorna um erro 404.
    // Isso impede que qualquer parte do painel admin seja acessível.
    return new NextResponse(null, { status: 404 });
  }

  // Lógica para o domínio do ADMIN
  if (hostname === ADMIN_DOMAIN) {
    // Se alguém tentar acessar a galeria pelo domínio do admin, redireciona para o domínio certo.
    if (pathname.startsWith('/galeria')) {
      const url = new URL(request.url);
      url.hostname = GALLERY_DOMAIN;
      return NextResponse.redirect(url);
    }
    // Permite todos os outros acessos no domínio do admin.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Roda o middleware para todas as rotas, exceto arquivos de sistema e imagens.
    '/((?!_next/static|_next/image|favicon.ico|logobarber.png|api/).*)',
  ],
};