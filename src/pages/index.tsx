import React from 'react';
import Head from 'next/head';
import ChatContainer from '../components/ChatContainer';
import { ChatProvider } from '../contexts/ChatContext';

export default function Home() {
  return (
    <div className="h-full">
      <Head>
        <title>Unified Assistant Prototype</title>
        <meta name="description" content="A unified chat assistant prototype" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="h-full p-4 md:p-8 max-w-5xl mx-auto">
        <ChatProvider>
          <ChatContainer />
        </ChatProvider>
      </main>
    </div>
  );
}