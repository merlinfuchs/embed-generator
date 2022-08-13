import json

import pymongo
from pymongo.errors import DuplicateKeyError

old_db = pymongo.MongoClient("mongodb://localhost:8181/").dclub

new_db = pymongo.MongoClient("mongodb://localhost:27017/").embedg

new_docs = []

for doc in old_db.messages.find({}):
    new_doc = {
        "_id": str(doc["_id"]),
        "owner_id": str(doc["user_id"]),
        "created_at": doc["last_updated"],
        "updated_at": doc["last_updated"],
        "name": doc["name"],
        "description": None,
        "payload_json": json.dumps({
            "username": doc["json"].get("username") or None,
            "avatar_url": doc["json"].get("avatar_url") or None,
            "content": doc["json"].get("content") or None,
            "embeds": [
                {
                    "description": embed.get("description") or None,
                    "timestamp": embed.get("timestamp") or None,
                    "title": embed.get("title") or None,
                    "url": embed.get("url") or None,
                    "color": embed.get("color") or None,
                    "fields": embed.get("fields", []),
                    "author": {
                        "name": embed["author"].get("name") or None,
                        "url": embed["author"].get("url") or None,
                        "icon_url": embed["author"].get("icon_url") or None,
                    } if (embed.get("author") and (
                                embed["author"].get("name") or embed["author"].get("url") or embed["author"].get(
                            "icon_url"))) else None,
                    "footer": {
                        "text": embed["footer"].get("text") or None,
                        "icon_url": embed["footer"].get("icon_url") or None,
                    } if (embed.get("footer") and (
                            embed["footer"].get("text") or embed["footer"].get("icon_url"))) else None,
                    "image": {
                        "url": embed["image"].get("url") or None,
                    } if (embed.get("image") and embed["image"].get("url")) else None,
                    "thumbnail": {
                        "url": embed["thumbnail"].get("url") or None,
                    } if (embed.get("thumbnail") and embed["thumbnail"].get("url")) else None,
                }
                for embed in doc["json"].get("embeds", [])
            ]
        })
    }
    new_docs.append(new_doc)

try:
    new_db.messages.insert_many(new_docs, ordered=False)
except DuplicateKeyError:
    pass
