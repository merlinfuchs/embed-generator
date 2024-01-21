export function userAvatarUrl(
  user: { id: string; discriminator: string; avatar: string | null },
  size: number = 128
) {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=${size}`;
  } else {
    let defaultAvatar: number | BigInt = parseInt(user.discriminator) % 5;
    if (!user.discriminator || user.discriminator === "0") {
      defaultAvatar = (BigInt(user.id) >> 22n) % 6n;
    }

    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png?size=${size}`;
  }
}

export function guildIconUrl(
  guild: { id: string; icon: string | null },
  size: number = 128
) {
  if (guild.icon) {
    return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=${size}`;
  } else {
    return `https://cdn.discordapp.com/embed/avatars/0.png?size=${size}`;
  }
}
