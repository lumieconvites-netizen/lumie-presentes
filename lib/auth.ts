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
        if (!ok) {
          throw new Error("Email ou senha inválidos");
        }

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
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      // 1) no login inicial
      if (user) {
        token.id = (user as any).id;
      }

      // 2) sempre que tiver token.id, reidrata do banco (inclui image atualizada)
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, name: true, email: true, role: true, image: true },
        });

        if (dbUser) {
          token.name = dbUser.name ?? token.name;
          token.email = dbUser.email ?? token.email;
          token.role = dbUser.role;
          token.picture = dbUser.image ?? null;
        }
      }

      // quando chamar update(), força refresh do banco também
      if (trigger === "update" && token.id) {
        // já caiu no bloco acima, então ok
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.email = (token.email as string) ?? session.user.email;
        (session.user as any).image = (token.picture as string) ?? null;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
