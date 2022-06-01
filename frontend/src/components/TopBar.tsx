export default function TopBar() {
  return (
    <div className="h-14 bg-dark-4 border-b border-dark-2 shadow-lg flex items-center px-3">
      <div className="flex-auto flex items-center space-x-5 text-sm">
        <a href="/discord" target="_blank">
          <img src="/logo192.png" alt="" className="h-9 w-9" />
        </a>
        <a
          href="/discord"
          target="_blank"
          className="font-medium text-gray-300 hover:text-white"
        >
          Discord Server
        </a>
        <a
          href="/invite"
          target="_blank"
          className="font-medium text-gray-300 hover:text-white"
        >
          Invite Bot
        </a>
        <a
          href="/github"
          target="_blank"
          className="font-medium text-gray-300 hover:text-white"
        >
          Source Code
        </a>
      </div>
      <div className="flex-none">
        <a
          className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark"
          href="/api/auth/redirect"
        >
          Login
        </a>
      </div>
    </div>
  );
}
