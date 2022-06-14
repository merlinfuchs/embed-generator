use futures_util::StreamExt;
use mongodb::bson::{doc, to_bson};
use mongodb::error::Error as MongoError;
use mongodb::options::{InsertOneOptions, UpdateOptions};
use mongodb::results::{DeleteResult, InsertOneResult, UpdateResult};
use serde::{Deserialize, Serialize};
use twilight_model::id::marker::UserMarker;
use twilight_model::id::Id;

use crate::db::get_collection;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageModel {
    pub id: String,
    pub owner_id: Id<UserMarker>,
    pub updated_at: u64,
    pub name: String,
    pub description: String,
    pub payload_json: String,
}

impl MessageModel {
    pub async fn create(&self) -> Result<InsertOneResult, MongoError> {
        get_collection::<Self>("messages")
            .insert_one(self, InsertOneOptions::builder().build())
            .await
    }

    pub async fn update(&self) -> Result<UpdateResult, MongoError> {
        get_collection::<Self>("messages")
            .update_one(
                doc! {"_id": &self.id, "user_id": self.owner_id.to_string()},
                doc! {"$set": to_bson(self).unwrap()},
                UpdateOptions::builder().build(),
            )
            .await
    }

    pub async fn find_by_user_id_and_id(
        user_id: Id<UserMarker>,
        id: &str,
    ) -> Result<Option<Self>, MongoError> {
        get_collection("messages")
            .find_one(doc! {"_id": id, "user_id": user_id.to_string()}, None)
            .await
    }

    pub async fn delete_by_user_id_and_id(
        user_id: Id<UserMarker>,
        id: &str,
    ) -> Result<DeleteResult, MongoError> {
        get_collection::<Self>("messages")
            .delete_one(doc! {"_id": id, "user_id": user_id.to_string()}, None)
            .await
    }

    pub async fn list_by_user_id(
        user_id: Id<UserMarker>,
    ) -> Result<Vec<Result<Self, MongoError>>, MongoError> {
        let cursor = get_collection("messages")
            .find(doc! {"user_id": user_id.to_string()}, None)
            .await?;

        Ok(cursor.collect().await)
    }
}
