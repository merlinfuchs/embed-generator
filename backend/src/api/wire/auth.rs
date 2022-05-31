use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct ExchangeTokenRequestWire {
    pub code: String,
}

#[derive(Serialize)]
pub struct ExchangeTokenResponseWire {
    pub token: String,
}
