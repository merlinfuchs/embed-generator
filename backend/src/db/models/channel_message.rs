use futures_util::StreamExt;
use mongodb::bson::{doc, Timestamp, to_bson};
use mongodb::error::Error as MongoError;
use mongodb::options::UpdateOptions;
use mongodb::results::{DeleteResult, UpdateResult};
use serde::{Deserialize, Serialize};
use twilight_model::id::Id;
use twilight_model::id::marker::{ChannelMarker, MessageMarker};

use crate::db::get_collection;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ChannelMessageModel {
    pub channel_id: Id<ChannelMarker>,
    pub message_id: Id<MessageMarker>,
    pub hash: String,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

impl ChannelMessageModel {
    pub async fn update_or_create(&self) -> Result<UpdateResult, MongoError> {
        get_collection::<Self>("channel_messages")
            .update_one(
                doc! {"message_id": self.message_id.to_string(), "channel_id": self.channel_id.to_string()},
                doc! {
                    "$set": doc! {
                        "hash": &self.hash,
                        "updated_at": self.updated_at,
                    },
                    "$setOnInsert": to_bson(self).unwrap()
                },
                UpdateOptions::builder().upsert(true).build(),
            )
            .await
    }

    pub async fn exists_by_message_id_and_hash(
        message_id: Id<MessageMarker>,
        hash: &str,
    ) -> Result<bool, MongoError> {
        get_collection::<Self>("channel_messages")
            .count_documents(
                doc! {"message_id": message_id.to_string(), "hash": hash},
                None,
            )
            .await
            .map(|count| count > 0)
    }

    pub async fn find_by_channel_id(
        channel_id: Id<ChannelMarker>,
    ) -> Result<Vec<Result<Self, MongoError>>, MongoError> {
        let cursor = get_collection::<Self>("channel_messages")
            .find(doc! {"channel_id": channel_id.to_string()}, None)
            .await?;

        Ok(cursor.collect().await)
    }

    pub async fn delete_by_message_id(
        message_id: Id<MessageMarker>,
    ) -> Result<DeleteResult, MongoError> {
        get_collection::<Self>("channel_messages")
            .delete_one(doc! {"message_id": message_id.to_string()}, None)
            .await
    }
}
