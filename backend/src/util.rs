use std::time::{SystemTime, UNIX_EPOCH};

use mongodb::bson::DateTime;
use nanoid::nanoid;

pub fn unix_now_seconds() -> u64 {
    let now = SystemTime::now();
    now.duration_since(UNIX_EPOCH).unwrap().as_secs()
}

pub fn unix_now_mongodb() -> DateTime {
    DateTime::from_millis(unix_now_seconds() as i64 * 1000)
}

const ID_ALPHABET: &[char] = &[
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's',
    't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
    'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4',
    '5', '6', '7', '8', '9',
];

pub fn get_unique_id() -> String {
    nanoid!(8, ID_ALPHABET)
}
