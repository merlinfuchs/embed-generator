import pymongo
from datetime import datetime

db = pymongo.MongoClient("mongodb://localhost:27017/").embedg

new_docs = []

for doc in db.messages.find({}):
    if type(doc["updated_at"]) != int:
        continue

    updated_at = datetime.fromtimestamp(doc["updated_at"])
    db.messages.update_one({"_id": doc["_id"]}, {"$set": {
        "updated_at": updated_at,
        "created_at": updated_at
    }})
