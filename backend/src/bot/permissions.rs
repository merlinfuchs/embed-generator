use twilight_model::guild::Permissions;
use twilight_model::id::marker::{ChannelMarker, GuildMarker, RoleMarker, UserMarker};
use twilight_model::id::Id;
use twilight_util::permission_calculator::PermissionCalculator;

use crate::bot::DISCORD_CACHE;

pub fn get_member_permissions_for_channel(
    user_id: Id<UserMarker>,
    roles_ids: &[Id<RoleMarker>],
    guild_id: Id<GuildMarker>,
    channel_id: Id<ChannelMarker>,
) -> Result<Permissions, ()> {
    let everyone_role = DISCORD_CACHE
        .role(guild_id.cast())
        .map(|r| r.permissions)
        .unwrap_or(Permissions::empty());

    let roles: Vec<(Id<RoleMarker>, Permissions)> = roles_ids
        .into_iter()
        .filter_map(|role_id| {
            DISCORD_CACHE
                .role(*role_id)
                .map(|r| (*role_id, r.permissions))
        })
        .collect();

    let guild = DISCORD_CACHE.guild(guild_id).ok_or(())?;

    let channel = DISCORD_CACHE.channel(channel_id).ok_or(())?;

    let calculator = PermissionCalculator::new(guild_id, user_id, everyone_role, &roles)
        .owner_id(guild.owner_id());
    let overwrites = channel.permission_overwrites.as_deref().unwrap_or(&[]);

    Ok(calculator.in_channel(channel.kind, overwrites))
}
