import Link from "next/link";

import { SuccessToast } from "./success-toast";
import { UserMenu } from "./user-menu";
import { MenuDock } from "./menu-dock";

export function MobileShell({
  title,
  description: _description,
  children,
  successMessage
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  successMessage?: string;
}) {
  return (
    <div className="relative min-h-screen w-full px-4 pb-16 pt-10 sm:px-6">
      <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-[minmax(0,1fr)_120px]">
        <div className="space-y-6">
          {successMessage && (
            <div className="flex justify-center">
              <SuccessToast message={successMessage} />
            </div>
          )}

          <section className="arcade-shell crt-noise relative overflow-visible rounded-[42px] border-[3px] border-white/40 bg-gradient-to-b from-[#18205a]/95 via-[#2e3fa3]/85 to-[#6d7fff]/85 p-6 pb-10 text-white shadow-arcade">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="mt-3 font-arcade text-2xl leading-relaxed tracking-[0.2em] text-white md:text-3xl">
                  {title.toUpperCase()}
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-white/85">
                  {_description}
                </p>
              </div>
              <UserMenu />
            </div>

            <div className="mt-8">
              <MenuDock />
            </div>
          </section>

          <main className="crt-noise relative rounded-[38px] border-4 border-white/70 bg-white/90 p-6 shadow-[0_30px_60px_rgba(5,20,52,0.35)] sm:p-8">
            {children}
          </main>
        </div>
      </div>
      <Link
        href="/rewards"
        className="absolute right-6 top-16 hidden md:block"
      >
        <div className="coin-wrapper cursor-pointer">
          <div className="insert-coin-box">
            INSERT
            <br />
            COIN
          </div>
          <div className="coin-slot">
            <div className="coin-hole" />
          </div>
          <p className="coin-note">QUICK MODE</p>
        </div>
      </Link>
    </div>
  );
}
