package rest

import "github.com/disgoorg/disgo/rest"

type RestClient struct {
	rest.Rest
}

func NewRestClient(token string, opts ...rest.ConfigOpt) *RestClient {
	return &RestClient{
		Rest: rest.New(rest.NewClient(token, opts...)),
	}
}

// TODO: Add caching for some endpoints
