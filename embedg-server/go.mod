module github.com/merlinfuchs/embed-generator/embedg-server

go 1.18

require (
	github.com/go-ozzo/ozzo-validation/v4 v4.3.0
	github.com/gofiber/fiber/v2 v2.43.0
	github.com/golang-migrate/migrate/v4 v4.15.2
	github.com/jellydator/ttlcache/v3 v3.0.1
	github.com/jmoiron/sqlx v1.3.5
	github.com/lib/pq v1.10.7
	github.com/matoous/go-nanoid v1.5.0
	github.com/merlinfuchs/discordgo v0.0.0-20231008082327-8d202b79141a
	github.com/merlinfuchs/embed-generator/embedg-app v0.0.0
	github.com/merlinfuchs/embed-generator/embedg-site v0.0.0-20231008112155-6159480ecdbf
	github.com/ravener/discord-oauth2 v0.0.0-20220615092331-f6a9839c223e
	github.com/redis/go-redis/v9 v9.0.4
	github.com/rs/zerolog v1.29.0
	github.com/sashabaranov/go-openai v1.17.6
	github.com/spf13/cobra v1.6.1
	github.com/spf13/viper v1.15.0
	github.com/sqlc-dev/pqtype v0.3.0
	github.com/vincent-petithory/dataurl v1.0.0
	go.mongodb.org/mongo-driver v1.11.6
	golang.org/x/oauth2 v0.0.0-20221014153046-6fdb5e3db783
	gopkg.in/guregu/null.v4 v4.0.0
	gopkg.in/natefinch/lumberjack.v2 v2.2.1
)

require (
	github.com/andybalholm/brotli v1.0.5 // indirect
	github.com/cespare/xxhash/v2 v2.2.0 // indirect
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
	github.com/fsnotify/fsnotify v1.6.0 // indirect
	github.com/golang/protobuf v1.5.2 // indirect
	github.com/golang/snappy v0.0.4 // indirect
	github.com/google/uuid v1.3.0 // indirect
	github.com/gorilla/websocket v1.4.2 // indirect
	github.com/hashicorp/errwrap v1.1.0 // indirect
	github.com/hashicorp/go-multierror v1.1.1 // indirect
	github.com/hashicorp/hcl v1.0.0 // indirect
	github.com/inconshreveable/mousetrap v1.0.1 // indirect
	github.com/klauspost/compress v1.16.3 // indirect
	github.com/magiconair/properties v1.8.7 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.17 // indirect
	github.com/mattn/go-runewidth v0.0.14 // indirect
	github.com/mitchellh/mapstructure v1.5.0 // indirect
	github.com/montanaflynn/stats v0.0.0-20171201202039-1bf9dbcd8cbe // indirect
	github.com/pelletier/go-toml/v2 v2.0.6 // indirect
	github.com/philhofer/fwd v1.1.2 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/rivo/uniseg v0.2.0 // indirect
	github.com/savsgio/dictpool v0.0.0-20221023140959-7bf2e61cea94 // indirect
	github.com/savsgio/gotils v0.0.0-20230208104028-c358bd845dee // indirect
	github.com/spf13/afero v1.9.3 // indirect
	github.com/spf13/cast v1.5.0 // indirect
	github.com/spf13/jwalterweatherman v1.1.0 // indirect
	github.com/spf13/pflag v1.0.5 // indirect
	github.com/subosito/gotenv v1.4.2 // indirect
	github.com/tinylib/msgp v1.1.8 // indirect
	github.com/valyala/bytebufferpool v1.0.0 // indirect
	github.com/valyala/fasthttp v1.45.0 // indirect
	github.com/valyala/tcplisten v1.0.0 // indirect
	github.com/xdg-go/pbkdf2 v1.0.0 // indirect
	github.com/xdg-go/scram v1.1.1 // indirect
	github.com/xdg-go/stringprep v1.0.3 // indirect
	github.com/youmark/pkcs8 v0.0.0-20181117223130-1be2e3e5546d // indirect
	go.uber.org/atomic v1.9.0 // indirect
	golang.org/x/crypto v0.7.0 // indirect
	golang.org/x/net v0.8.0 // indirect
	golang.org/x/sync v0.1.0 // indirect
	golang.org/x/sys v0.6.0 // indirect
	golang.org/x/text v0.8.0 // indirect
	google.golang.org/appengine v1.6.7 // indirect
	google.golang.org/protobuf v1.28.1 // indirect
	gopkg.in/ini.v1 v1.67.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)

replace github.com/merlinfuchs/embed-generator/embedg-app v0.0.0 => ../embedg-app
