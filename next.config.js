/** @type {import('next').NextConfig} */
const nextConfig = {
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
  async rewrites() {
    return {
      // Essas regras são processadas ANTES dos arquivos do Next.js
      beforeFiles: [
        // Regra para o domínio da galeria
        {
          source: '/:path((?!galeria/).*)', // Captura tudo que NÃO começa com /galeria
          has: [
            {
              type: 'host',
              value: 'galeria-lavacar.vercel.app',
            },
          ],
          destination: 'https://agendamento-lavacar.vercel.app', // Manda para o admin
        },
      ],
      // Essas regras são processadas DEPOIS, se nenhum arquivo for encontrado
      afterFiles: [
         // Se alguém no admin acessar o link da galeria, redireciona para o domínio certo
        {
          source: '/galeria/:path*',
          destination: 'https://galeria-lavacar.vercel.app/galeria/:path*',
          has: [
            {
              type: 'host',
              value: 'agendamento-lavacar.vercel.app',
            },
          ],
        },
      ]
    }
  },
};

module.exports = nextConfig;