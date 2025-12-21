import Chatbot from "@/components/chat/Chatbot";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-center">AI-Powered Todo Chatbot</h1>
      </div>
      <div className="mt-8 text-center">
        <p className="text-lg">
          Welcome! Use the chat interface to manage your tasks.
        </p>
        <p className="text-sm text-gray-500">
          Click the chat icon on the bottom right to get started.
        </p>
      </div>
      <Chatbot />
    </main>
  );
}
