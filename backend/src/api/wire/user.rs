use serde::{Deserialize, Serialize};

use crate::db::models::UserModel;

#[derive(Serialize, Deserialize)]
pub struct UserWire {
    pub id: String,
    pub username: String,
    pub discriminator: String,
    pub avatar: Option<String>,
}

impl From<UserModel> for UserWire {
    fn from(u: UserModel) -> Self {
        Self {
            id: u.id.to_string(),
            username: u.username,
            discriminator: u.discriminator,
            avatar: u.avatar,
        }
    }
}
