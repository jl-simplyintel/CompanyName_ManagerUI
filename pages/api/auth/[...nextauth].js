// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export default NextAuth({
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                console.log('Received credentials:', credentials);
                const { email, password } = credentials || {};

                if (!email || !password) {
                    console.error('Email or password missing.');
                    return null;
                }

                try {
                    const res = await fetch(process.env.NEXT_PUBLIC_API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            query: `
                                mutation AuthenticateUser($email: String!, $password: String!) {
                                    authenticateUserWithPassword(email: $email, password: $password) {
                                        ... on UserAuthenticationWithPasswordSuccess {
                                            item {
                                                id
                                                email
                                                name
                                                role
                                            }
                                        }
                                        ... on UserAuthenticationWithPasswordFailure {
                                            message
                                        }
                                    }
                                }
                            `,
                            variables: { email, password },
                        }),
                    });

                    const data = await res.json();
                    console.log('Response from Keystone API:', data);

                    // Check if there was an error in the GraphQL response
                    if (data.errors) {
                        console.error('GraphQL errors:', data.errors);
                        return null;
                    }

                    // Extract the result from the response
                    const result = data.data.authenticateUserWithPassword;

                    if (result.__typename === 'UserAuthenticationWithPasswordFailure') {
                        console.error('Authentication failed:', result.message);
                        return null;
                    }

                    // Authentication was successful
                    const user = result.item;
                    console.log('Authorized user:', user);

                    // Allow only users with the role of 'manager'
                    if (user.role !== 'manager') {
                        console.error('Access denied: User is not a manager');
                        return null;
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name || 'N/A',
                        role: user.role || 'guest',
                    };
                } catch (error) {
                    console.error('Error during authorization:', error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            console.log('JWT callback: user', user); // Debugging
            if (user) {
                token.id = user.id || '';
                token.email = user.email || '';
                token.name = user.name || 'N/A';
                token.role = user.role || 'guest';
            }
            console.log('JWT callback: token', token); // Debugging
            return token;
        },
        async session({ session, token }) {
            console.log('Session callback: token', token); // Debugging
            session.user.id = token.id || '';
            session.user.email = token.email || '';
            session.user.name = token.name || 'N/A';
            session.user.role = token.role || 'guest';
            console.log('Session callback: session', session); // Debugging
            return session;
        },
    },
    session: {
        jwt: true,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/auth/signin',
    },
});
