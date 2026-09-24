# Shared by deploy-app.sh and deploy-site.sh.

DEPLOY_HOST="${DEPLOY_HOST:-root@embedg-main}"

# With a lazy nvm setup, pnpm and node are zsh functions rather than binaries, so a
# script sees neither. Take the version .nvmrc asks for straight out of the nvm
# directory instead of sourcing nvm.sh, which is slow and wants to install things.
ensure_pnpm() {
	command -v pnpm > /dev/null 2>&1 && return 0

	local want bin nvm_dir
	nvm_dir="${NVM_DIR:-$HOME/.nvm}"
	want="$(tr -d '[:space:]v' < .nvmrc 2>/dev/null || true)"

	if [ -d "$nvm_dir/versions/node/v$want/bin" ]; then
		bin="$nvm_dir/versions/node/v$want/bin"
	else
		bin="$(ls -d "$nvm_dir/versions/node/v$want."*/bin 2>/dev/null | sort -V | tail -1)"
	fi

	if [ -z "$bin" ] || [ ! -x "$bin/pnpm" ]; then
		echo "pnpm not found: node ${want:-?} from .nvmrc isn't installed under $nvm_dir" >&2
		return 1
	fi

	export PATH="$bin:$PATH"
}

# Uploads a built frontend and hands it to Caddy with the modes it can actually read:
# the caddy user needs o+rx on every directory, and rsync -a would otherwise carry
# whatever the build left behind.
deploy_static() {
	local src="$1" dest="$2"

	if [ ! -d "$src" ]; then
		echo "no build output at $src" >&2
		return 1
	fi

	echo "==> uploading $(du -sh "$src" | cut -f1) to $DEPLOY_HOST:$dest"

	# Staged beside the live directory and swapped at the end, so a request landing
	# mid-upload never sees a half-written tree. openrsync on macOS has no --chown
	# or --chmod, so ownership and modes are fixed on the far side.
	rsync -a --delete "$src/" "$DEPLOY_HOST:$dest.new/"

	ssh "$DEPLOY_HOST" "
		set -e
		chown -R root:root '$dest.new'
		find '$dest.new' -type d -exec chmod 755 {} +
		find '$dest.new' -type f -exec chmod 644 {} +
		rm -rf '$dest.old'
		if [ -d '$dest' ]; then mv '$dest' '$dest.old'; fi
		mv '$dest.new' '$dest'
		rm -rf '$dest.old'
	"
}
