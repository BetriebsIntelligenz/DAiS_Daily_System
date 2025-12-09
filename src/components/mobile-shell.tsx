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
    <div className="min-h-screen bg-transparent">
      <div className="relative isolate mx-auto max-w-4xl px-5 pb-16 pt-10">

        <div className="space-y-5">
          {successMessage && (
            <div className="flex justify-center">
              <SuccessToast message={successMessage} />
            </div>
          )}
          <div className="rounded-[32px] bg-gradient-to-b from-[#0d4bff] via-[#2861ff] to-[#4b7cff] p-6 pb-8 text-white shadow-soft">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                  {title}
                </h1>
              </div>
              <UserMenu />
            </div>
            <div className="mt-6">
              <MenuDock />
            </div>
          </div>
        </div>

        <main className="mt-6 space-y-6 rounded-[22px] bg-white/95 p-6 shadow-card">
          {children}
        </main>
      </div>
    </div>
  );
}
