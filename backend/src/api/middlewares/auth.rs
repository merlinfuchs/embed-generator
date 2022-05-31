use std::future::{ready, Ready};

use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage,
};
use futures_util::future::LocalBoxFuture;

use crate::api::response::RouteError;
use crate::tokens::decode_token;

pub struct AuthCheck;

impl<S, B> Transform<S, ServiceRequest> for AuthCheck
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = AuthMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthMiddleware { service }))
    }
}

pub struct AuthMiddleware<S> {
    service: S,
}

impl<S, B> Service<ServiceRequest> for AuthMiddleware<S>
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
        let token_data = {
            let headers = req.headers();
            if let Some(token) = headers.get("Authorization") {
                if let Ok(token_data) = decode_token(token.to_str().unwrap()) {
                    Some(token_data)
                } else {
                    None
                }
            } else {
                None
            }
        };

        let is_auth = token_data.is_some();
        if let Some(token_data) = token_data {
            req.extensions_mut().insert(token_data);
        }

        let fut = self.service.call(req);

        Box::pin(async move {
            if is_auth {
                fut.await
            } else {
                Err(RouteError::InvalidToken.into())
            }
        })
    }
}
