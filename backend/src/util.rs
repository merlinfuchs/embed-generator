use std::time::{SystemTime, UNIX_EPOCH};

pub fn unix_now_seconds() -> u64 {
    let now = SystemTime::now();
    now.duration_since(UNIX_EPOCH).unwrap().as_secs()
}

pub fn unix_now_mongodb() -> mongodb::bson::Timestamp {
    mongodb::bson::Timestamp {
        time: unix_now_seconds() as u32,
        increment: 0,
    }
}