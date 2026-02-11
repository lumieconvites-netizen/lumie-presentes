import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Email ou senha inválidos');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Email ou senha inválidos');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
callbacks: {
  async jwt({ token, user }) {
    // quando faz login
    if (user) {
      token.id = (user as any).id;
      token.role = (user as any).role;
      token.name = (user as any).name;
      token.picture = (user as any).image;
      token.email = (user as any).email;
    }
    return token;
  },
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.name = (token.name as string) ?? session.user.name;
      session.user.email = (token.email as string) ?? session.user.email;
      (session.user as any).image = (token.picture as string) ?? (session.user as any).image;
    }
    return session;
  },
},
  secret: process.env.NEXTAUTH_SECRET,
};
