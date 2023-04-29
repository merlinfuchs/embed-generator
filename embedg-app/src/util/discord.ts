export function userAvatarUrl(
  user: { id: string; discriminator: string; avatar: string | null },
  size: number = 128
) {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=${size}`;
  } else {
    return `https://cdn.discordapp.com/embed/avatars/${
      parseInt(user.discriminator) % 5
    }.png?size=${size}`;
  }
}

export function colorIntToHex(color: number) {
  return "#" + color.toString(16).padStart(6, "0");
}

export function colorHexToInt(color: string) {
  return parseInt(color.replace("#", ""), 16);
}
