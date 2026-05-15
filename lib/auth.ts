import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // On first sign-in, store the Google account ID (stable across sessions)
      if (account && profile) {
        token.googleId = (profile as { sub?: string }).sub ?? account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      // Use Google's stable ID, not the rotating JWT sub
      session.user.id = (token.googleId as string) ?? token.sub ?? "";
      return session;
    },
  },
});
