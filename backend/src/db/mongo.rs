use std::error::Error;

pub use mongodb::error::Error as DatabaseError;
use mongodb::{Client, Collection, Database};
use once_cell::sync::OnceCell;

static DB_CONN: OnceCell<Client> = OnceCell::new();

pub fn get_connection() -> &'static Client {
    DB_CONN.get().unwrap()
}

pub fn get_database() -> Database {
    get_connection().database("kite")
}

pub fn get_collection<T>(name: &str) -> Collection<T> {
    get_database().collection(name)
}

pub async fn connect(mongo_url: &str) -> Result<(), Box<dyn Error>> {
    let client = Client::with_uri_str(mongo_url).await?;

    DB_CONN.set(client).unwrap();
    Ok(())
}
