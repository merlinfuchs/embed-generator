use twilight_model::id::Id;
use twilight_model::util::Timestamp;

pub fn id_to_timestamp<T>(id: Id<T>) -> Timestamp {
    Timestamp::from_micros((((id.get() >> 22) + 1420070400000u64) * 1000) as i64).unwrap()
}
