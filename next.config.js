/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sua configuração de imagens e outras que já existiam
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // ATENÇÃO: Adicione a seção rewrites aqui
  async rewrites() {
    return [
      // Regra para o domínio da galeria
      {
        source: '/:path*',
        destination: '/:path*', // Rota interna permanece a mesma
        has: [
          {
            type: 'host',
            value: 'galeria-lavacar.vercel.app',
          },
        ],
        // Redireciona tudo que NÃO for da galeria para o domínio principal
        missing: [
          {
            type: 'header',
            key: 'x-nextjs-data',
          },
          {
            type: 'query',
            key: 'path',
            value: 'galeria', // Só permite o que começa com /galeria
          },
        ],
        permanent: false,
      },
      // Regra para o domínio principal (admin)
      {
        source: '/galeria/:path*',
        destination: 'https://galeria-lavacar.vercel.app/galeria/:path*', // Redireciona /galeria para o subdomínio
        has: [
          {
            type: 'host',
            value: 'agendamento-lavacar.vercel.app',
          },
        ],
        permanent: false,
      },
    ]
  },
};

module.exports = nextConfig;