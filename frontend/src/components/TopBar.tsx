import { useEffect, useRef } from "react";
import { Disclosure } from "@headlessui/react";
import { LogoutIcon, MenuIcon, XIcon } from "@heroicons/react/outline";
import useToken from "../hooks/useToken";
import useUser from "../hooks/useUser";
import { userAvatarUrl } from "../discord/utils";
import MessageManager from "./MessageManager";

const navigation = [
  { name: "Discord Server", href: "/api/link/discord" },
  { name: "Invite Bot", href: "/api/link/invite" },
  { name: "Source Code", href: "/api/link/source" },
];

export default function Example() {
  const [, setToken] = useToken();
  const user = useUser();

  const requestMade = useRef(false);

  useEffect(() => {
    const url = new URL(window.location.toString());
    const code = url.searchParams.get("code");

    if (code && !requestMade.current) {
      requestMade.current = true;

      fetch("/api/auth/exchange", {
        method: "POST",
        body: JSON.stringify({ code }),
        headers: { "Content-Type": "application/json" },
      })
        .then((resp) => resp.json())
        .then((resp) => setToken(resp.data.token));

      url.searchParams.delete("code");
      window.history.pushState(null, "", url.toString());
    }
  }, [setToken]);

  return (
    <Disclosure as="nav" className="bg-dark-3 border-b border-dark-2 shadow-md">
      {({ open }) => (
        <>
          <div className="px-4">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="-ml-2 mr-2 flex items-center md:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-dark-4 focus:bg-dark-4">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
                <div className="flex-shrink-0 flex items-center">
                  <img
                    className="h-10 w-10 w-auto hidden md:block rounded-full"
                    src="/logo128.png"
                    alt="Workflow"
                  />
                </div>
                <div className="hidden md:ml-4 md:flex md:items-center md:space-x-3">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-dark-4 hover:text-white"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                {!!user ? (
                  <MessageManager />
                ) : (
                  <a
                    className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark"
                    href="/api/auth/redirect"
                  >
                    <div>Login</div>
                  </a>
                )}
                {!!user && (
                  <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
                    {/* Profile dropdown */}
                    <img
                      className="h-8 w-8 rounded-full mr-4"
                      src={userAvatarUrl(user)}
                      alt=""
                    />
                    <button
                      type="button"
                      className="rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                      onClick={() => setToken(null)}
                    >
                      <span className="sr-only">Logout</span>
                      <LogoutIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Disclosure.Panel className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-dark-4 hover:text-white"
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.name}
                </a>
              ))}
            </div>
            {!!user && (
              <div className="pt-4 pb-3 border-t border-gray-700">
                <div className="flex items-center px-5 sm:px-6">
                  <div className="flex-shrink-0">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={userAvatarUrl(user)}
                      alt=""
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">
                      {user.username}
                    </div>
                    <div className="text-sm font-medium text-dark-7">
                      {user.id}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ml-auto flex-shrink-0 mr-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                    onClick={() => setToken(null)}
                  >
                    <span className="sr-only">Logout</span>
                    <LogoutIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
