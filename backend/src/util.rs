use std::time::{SystemTime, UNIX_EPOCH};

use mongodb::bson::DateTime;

pub fn unix_now_seconds() -> u64 {
    let now = SystemTime::now();
    now.duration_since(UNIX_EPOCH).unwrap().as_secs()
}

pub fn unix_now_mongodb() -> DateTime {
    DateTime::from_millis(unix_now_seconds() as i64 * 1000)
}
