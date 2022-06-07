use std::error::Error;

use tokio::select;

use crate::api::serve_api;
use crate::bot::run_bot;
use crate::config::CONFIG;

mod api;
mod bot;
mod config;
mod db;
mod tokens;
mod util;

#[actix_web::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let test = String::from("🧙‍♀️");

    let twemoji: String = test.chars().map(|c| format!("{:x}", c as u32)).collect::<Vec<String>>().join("-");
    println!("{}", twemoji);

    env_logger::init();
    db::connect(&CONFIG.mongo_url).await?;

    select! {
        r = run_bot() => r,
        r = serve_api() => r
    }
}
