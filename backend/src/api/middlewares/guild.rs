use std::future::{ready, Ready};

use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage,
};
use futures_util::future::LocalBoxFuture;
use twilight_model::id::marker::{GuildMarker, UserMarker};
use twilight_model::id::Id;

use crate::api::response::RouteError;
use crate::db::models::GuildsWithAccessModel;
use crate::tokens::TokenClaims;

pub struct GuildExtractor;

impl<S, B> Transform<S, ServiceRequest> for GuildExtractor
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = GuildMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(GuildMiddleware { service }))
    }
}

pub struct GuildMiddleware<S> {
    service: S,
}

impl<S, B> Service<ServiceRequest> for GuildMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let context: Option<(Id<GuildMarker>, Id<UserMarker>)> = {
            let ext = req.extensions();
            match ext.get::<TokenClaims>() {
                Some(token) => match req.match_info().query("guild_id").parse().ok() {
                    Some(gid) => Some((gid, token.user_id)),
                    None => None,
                },
                None => None,
            }
        };

        if let Some((guild_id, _)) = context {
            req.extensions_mut().insert(guild_id);
        }

        let fut = self.service.call(req);

        Box::pin(async move {
            match context {
                Some((guild_id, user_id)) => {
                    match GuildsWithAccessModel::check_user_access_to_guild(user_id, guild_id).await
                    {
                        Ok(true) => fut.await,
                        _ => Err(RouteError::MissingGuildAccess.into()),
                    }
                }
                None => Err(RouteError::MissingGuildAccess.into()),
            }
        })
    }
}
