pub use auth::*;
pub use guild::*;
pub use message::*;
pub use shared_message::*;
pub use user::*;

use crate::api::response::RouteError;

mod auth;
mod guild;
mod message;
mod shared_message;
mod user;

pub trait NormalizeValidate: Sized {
    fn validate(&self) -> Result<(), RouteError>;
    fn normalize(self) -> Self;
    fn normalize_and_validate(self) -> Result<Self, RouteError> {
        let normalized = self.normalize();
        normalized.validate()?;
        Ok(normalized)
    }
}
