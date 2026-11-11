import { Backdrop } from "@/components/Backdrop";
import { ConnectButton } from "@/components/ConnectButton";
import { ChainMark } from "@/components/icons";
import { script } from "@/lib/fonts";

export default function SignInScreen() {
  return (
    <div className="relative flex min-h-dvh w-full flex-1 flex-col overflow-hidden bg-black font-sans text-white">
      <Backdrop />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-5">
        <header className="flex w-full shrink-0 flex-col items-center pt-12 text-center sm:pt-16">
          <ChainMark className="h-[52px] w-[86px] drop-shadow-[0_8px_18px_rgba(0,0,0,0.4)]" />
          <h1
            className={`${script.className} mt-1 text-[4.35rem] leading-none tracking-wide text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)] sm:text-[4.7rem]`}
          >
            LoyalChain
          </h1>
          <p className="mt-3 text-[15px] font-light leading-snug tracking-wide text-white/95 drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
            Real restaurants. Real rewards.
            <br />
            On chain.
          </p>
        </header>

        <div
          className="flex flex-1 items-center justify-center px-2 pb-6 text-center"
          aria-label="Wallet connection"
        >
          <ConnectButton />
        </div>
      </div>

      <footer className="relative z-10 flex flex-col items-start justify-between gap-5 px-6 pb-7 sm:flex-row sm:items-end sm:px-10 sm:pb-8">
        <p
          className={`${script.className} max-w-[15rem] text-[1.85rem] leading-[1.2] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)]`}
        >
          More than a meal,
          <br />
          It&apos;s a connection.
        </p>
        <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-black/55 py-1.5 pr-3.5 pl-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md">
          <HederaMark />
          <span className="text-[13px] font-medium tracking-wide text-white/90">
            Built on Hedera
          </span>
        </div>
      </footer>
    </div>
  );
}

function HederaMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <circle cx="12" cy="12" r="10.25" fill="white" />
      <path
        d="M8.2 7.1v9.8M15.8 7.1v9.8M8.2 12h7.6"
        stroke="#161616"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
