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
