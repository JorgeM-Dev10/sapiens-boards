import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcrypt'

// Validar variables de entorno requeridas
if (!process.env.NEXTAUTH_SECRET) {
  console.error('⚠️ ADVERTENCIA: NEXTAUTH_SECRET no está configurado. La autenticación puede fallar.')
  console.error('💡 Genera un secreto con: openssl rand -base64 32')
}

export const authOptions: NextAuthOptions = {
  // No usar adapter con CredentialsProvider + JWT strategy
  // adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🔐 [AUTH] Iniciando autorización para:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.error('❌ [AUTH] Credenciales faltantes')
          throw new Error('Credenciales inválidas')
        }

        try {
          console.log('🔍 [AUTH] Buscando usuario en base de datos...')
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          })

          if (!user) {
            console.error('❌ [AUTH] Usuario no encontrado:', credentials.email)
            throw new Error('Usuario no encontrado')
          }

          if (!user.password) {
            console.error('❌ [AUTH] Usuario sin contraseña:', credentials.email)
            throw new Error('Usuario no encontrado')
          }

          console.log('🔑 [AUTH] Verificando contraseña...')
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.error('❌ [AUTH] Contraseña incorrecta para:', credentials.email)
            throw new Error('Contraseña incorrecta')
          }

          console.log('✅ [AUTH] Autenticación exitosa para:', user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          console.error('💥 [AUTH] Error en autenticación:', error)
          if (error instanceof Error) {
            throw error
          }
          throw new Error('Error desconocido en autenticación')
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string | null | undefined
        session.user.image = token.picture as string | null | undefined
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  // Configuración adicional para CredentialsProvider
  trustHost: true,
}



