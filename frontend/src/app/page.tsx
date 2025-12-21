import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Phase III: AI-Powered Todo Chatbot
        </p>
      </div>

      <div className="relative flex place-items-center mb-12">
        <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl text-center">
          Next-Gen <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">
            Todo Chatbot
          </span>
        </h1>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-2 lg:text-left gap-8">
        <Link
          href="/chat"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-white/30 hover:bg-white/10"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Start Chatting{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Manage your tasks using natural language, voice commands, and Urdu support.
          </p>
        </Link>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-white/30 hover:bg-white/10">
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Powered by Claude{" "}
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Advanced agent orchestration with specialized skills for intent extraction.
          </p>
        </div>
      </div>
    </main>
  );
}
