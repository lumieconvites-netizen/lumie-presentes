import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Email ou senha inválidos");
        }

        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) throw new Error("Email ou senha inválidos");

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        } as any;
      },
    }),
  ],

  pages: {
    // ⚠️ no seu app, login está em /auth/login
    signIn: "/auth/login",
    error: "/auth/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 1) no login inicial
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.name = (user as any).name;
        token.email = (user as any).email;
        token.picture = (user as any).image ?? null;
        return token;
      }

      // 2) quando alguém chamar session.update()
      if (trigger === "update" && session?.user) {
        token.name = session.user.name ?? token.name;
        token.email = session.user.email ?? token.email;
        // @ts-ignore
        token.picture = (session.user as any).image ?? token.picture;
        return token;
      }

      // 3) em refresh/requests: sincroniza com o banco (persistência real)
      if (token?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { name: true, email: true, image: true, role: true },
        });

        if (dbUser) {
          token.name = dbUser.name ?? token.name;
          token.email = dbUser.email ?? token.email;
          token.picture = dbUser.image ?? token.picture;
          token.role = dbUser.role ?? token.role;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.email = (token.email as string) ?? session.user.email;
        // padrão do next-auth é session.user.image
        session.user.image = (token.picture as string) ?? session.user.image;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
