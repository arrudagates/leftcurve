'use client';

import { PrivyProvider } from "@privy-io/react-auth";

export default function ClientProviders({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PrivyProvider
            appId="cm2gzokbd096cwv5ifet2a6ke"
            config={{
                appearance: {
                    theme: 'light',
                    accentColor: '#676FFF',
                    logo: 'https://your-logo-url',
                },
                embeddedWallets: {
                    createOnLogin: 'users-without-wallets',
                },
            }}
        >
            {children}
        </PrivyProvider>
    );
}
