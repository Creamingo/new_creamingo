'use client';

import { Inter } from 'next/font/google'
import './globals.css'
import { PinCodeProvider } from '../contexts/PinCodeContext'
import { CategoryMenuProvider } from '../contexts/CategoryMenuContext'
import { CartProvider } from '../contexts/CartContext'
import { CustomerAuthProvider } from '../contexts/CustomerAuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import { WishlistProvider } from '../contexts/WishlistContext'
import { SearchProvider } from '../contexts/SearchContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { WalletProvider } from '../contexts/WalletContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import WalletComponents from '../components/WalletComponents'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Enable browser scroll restoration so back button returns to previous scroll position */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if ('scrollRestoration' in history) {
                  history.scrollRestoration = 'auto';
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
        <ToastProvider>
          <CustomerAuthProvider>
            <NotificationProvider>
            <WalletProvider>
              <PinCodeProvider>
                <CategoryMenuProvider>
                  <WishlistProvider>
                    <SearchProvider>
                      <CartProvider>
                        <WalletComponents />
                        {children}
                      </CartProvider>
                    </SearchProvider>
                  </WishlistProvider>
                </CategoryMenuProvider>
              </PinCodeProvider>
            </WalletProvider>
            </NotificationProvider>
          </CustomerAuthProvider>
        </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}