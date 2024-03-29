package transfer

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/lib/pq"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/redis/go-redis/v9"
	"github.com/spf13/viper"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type OldSavedMessage struct {
	ID          string    `bson:"_id"`
	OwnerID     string    `bson:"owner_id"`
	CreatedAt   time.Time `bson:"created_at"`
	UpdatedAt   time.Time `bson:"updated_at"`
	Name        string    `bson:"name"`
	Description string    `bson:"description"`
	PayloadJSON string    `bson:"payload_json"`
}

type OldUsers struct {
	ID            string `bson:"_id"`
	Username      string `bson:"username"`
	Discriminator string `bson:"discriminator"`
	Avatar        string `bson:"avatar"`
}

func TransferDB() {
	pg := postgres.NewPostgresStore()

	redisDB := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})

	mongoURL := viper.GetString("mongo.url")
	if mongoURL == "" {
		mongoURL = "mongodb://localhost:27017"
	}

	mongo, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(mongoURL))
	if err != nil {
		panic(err)
	}

	coll := mongo.Database("embedg").Collection("messages")

	var skip int64 = 0

	cursor, err := coll.Find(context.TODO(), bson.M{
		// "owner_id": "386861188891279362",
	}, options.Find().SetBatchSize(100).SetSkip(skip).SetSort(bson.M{"updated_at": -1}))
	if err != nil {
		panic(err)
	}

	session, err := discordgo.New("Bot " + viper.GetString("discord.token"))
	if err != nil {
		panic(err)
	}

	i := skip
	for cursor.Next(context.Background()) {
		var result OldSavedMessage
		if err := cursor.Decode(&result); err != nil {
			log.Fatal(err)
		}

		_, err := pg.Q.GetUser(context.TODO(), result.OwnerID)
		if err != nil {
			if err != sql.ErrNoRows {
				panic(err)
			}

			raw, err := redisDB.Get(context.Background(), "users:"+result.OwnerID).Result()
			if err != nil {
				if err != redis.Nil {
					panic(err)
				}

				user, err := session.User(result.OwnerID)
				if err != nil {
					panic(err)
				}

				fmt.Println("fetched user")

				pg.Q.UpsertUser(context.TODO(), postgres.UpsertUserParams{
					ID:            user.ID,
					Name:          user.Username,
					Discriminator: user.Discriminator,
					Avatar:        sql.NullString{String: user.Avatar, Valid: user.Avatar != ""},
				})
			} else {
				var user OldUsers
				err = json.Unmarshal([]byte(raw), &user)
				if err != nil {
					panic(err)
				}

				fmt.Println("got user from redis")

				pg.Q.UpsertUser(context.TODO(), postgres.UpsertUserParams{
					ID:            user.ID,
					Name:          user.Username,
					Discriminator: user.Discriminator,
					Avatar:        sql.NullString{String: user.Avatar, Valid: user.Avatar != ""},
				})
			}
		}

		var msgData actions.MessageWithActions
		err = json.Unmarshal([]byte(result.PayloadJSON), &msgData)
		if err != nil {
			fmt.Println("Failed to unmarshal message", result.ID)
			continue
		}

		if msgData.Content == "" && len(msgData.Components) == 0 && len(msgData.Embeds) == 0 {
			continue
		}

		newEmbeds := make([]*discordgo.MessageEmbed, 0)
		for _, embed := range msgData.Embeds {
			if embed.Footer != nil || embed.Author != nil || embed.Title != "" || embed.Description != "" || len(embed.Fields) != 0 || embed.Image != nil || embed.Thumbnail != nil {
				newEmbeds = append(newEmbeds, embed)
			}
		}

		msgData.Embeds = newEmbeds

		rawMsg, err := json.Marshal(&msgData)
		if err != nil {
			panic(err)
		}

		_, err = pg.Q.InsertSavedMessage(context.TODO(), postgres.InsertSavedMessageParams{
			ID:          result.ID,
			CreatorID:   result.OwnerID,
			GuildID:     sql.NullString{},
			UpdatedAt:   result.UpdatedAt,
			Name:        result.Name,
			Description: sql.NullString{Valid: result.Description != "", String: result.Description},
			Data:        json.RawMessage(rawMsg),
		})
		if err != nil {
			if (err.(*pq.Error)).Code == "23505" {
				continue
			}
			panic(err)
		}

		i++
		fmt.Println(i)
	}
}
