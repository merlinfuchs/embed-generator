package premium

type Plan struct {
	ID      string `mapstructure:"id"`
	PriceID string `mapstructure:"price_id"`
}
