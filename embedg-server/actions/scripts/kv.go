package scripts

import (
	"encoding/json"
	"fmt"

	"go.starlark.net/starlark"
	"go.starlark.net/starlarkstruct"
)

func (c *ScriptContext) KVStruct() *starlarkstruct.Struct {
	return starlarkstruct.FromStringDict(starlarkstruct.Default, starlark.StringDict{
		"set": starlark.NewBuiltin("set", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			ctx := thread.Local("ctx").(*ScriptContext)
			ctx.Idle()
			defer ctx.Unidle()

			var key string
			var value starlark.Value
			if err := starlark.UnpackArgs(b.Name(), args, kwargs, "key", &key, "value", &value); err != nil {
				return starlark.None, err
			}

			raw, err := valueToJSON(value)
			if err != nil {
				return starlark.None, err
			}

			err = ctx.KVStore.Set(key, raw)
			if err != nil {
				return starlark.None, err
			}

			return starlark.None, nil
		}),
		"get": starlark.NewBuiltin("get", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			ctx := thread.Local("ctx").(*ScriptContext)
			ctx.Idle()
			defer ctx.Unidle()

			var key string
			if err := starlark.UnpackArgs(b.Name(), args, kwargs, "key", &key); err != nil {
				return starlark.None, err
			}

			raw, err := ctx.KVStore.Get(key)
			if err != nil {
				return starlark.None, err
			}

			value, err := jsonToValue(raw)
			if err != nil {
				return starlark.None, err
			}

			return value, nil
		}),
		"delete": starlark.NewBuiltin("get", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			ctx := thread.Local("ctx").(*ScriptContext)
			ctx.Idle()
			defer ctx.Unidle()

			var key string
			if err := starlark.UnpackArgs(b.Name(), args, kwargs, "key", &key); err != nil {
				return starlark.None, err
			}

			raw, err := ctx.KVStore.Delete(key)
			if err != nil {
				return starlark.None, err
			}

			value, err := jsonToValue(raw)
			if err != nil {
				return starlark.None, err
			}

			return value, nil
		}),
		"increase": starlark.NewBuiltin("increase", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			ctx := thread.Local("ctx").(*ScriptContext)
			ctx.Idle()
			defer ctx.Unidle()

			var key string
			var increment int = 1
			if err := starlark.UnpackArgs(b.Name(), args, kwargs, "key", &key, "increment?", &increment); err != nil {
				return starlark.None, err
			}

			raw, err := ctx.KVStore.Get(key)
			if err != nil {
				return starlark.None, err
			}

			var res starlark.Value
			if raw == nil {
				res = starlark.MakeInt(0)
			} else {
				value, err := jsonToValue(raw)
				if err != nil {
					return starlark.None, err
				}

				var currentInt int
				err = starlark.AsInt(value, &currentInt)
				if err != nil {
					return starlark.None, err
				}
				res = starlark.MakeInt(currentInt + increment)
			}

			raw, err = valueToJSON(res)
			if err != nil {
				return starlark.None, err
			}

			ctx.KVStore.Set(key, raw)
			return res, nil
		}),
	})
}

type KVStore interface {
	Set(key string, value []byte) error
	Get(key string) ([]byte, error)
	Delete(key string) ([]byte, error)
	List() (map[string][]byte, error)
}

func valueToJSON(value starlark.Value) ([]byte, error) {
	res := SerializedValue{
		Type: value.Type(),
	}

	switch value := value.(type) {
	case starlark.NoneType:
		res.Data = nil
	case starlark.String:
		res.Data = string(value)
	case starlark.Bool:
		res.Data = bool(value)
	case starlark.Int:
		res.Data, _ = value.Int64()
	case starlark.Float:
		res.Data = float64(value)
	default:
		return nil, fmt.Errorf("Unsupported data type of KV: %s", value.Type())
	}

	raw, err := json.Marshal(res)
	return raw, err
}

func jsonToValue(data []byte) (starlark.Value, error) {
	if data == nil {
		return starlark.None, nil
	}

	var value SerializedValue
	err := json.Unmarshal(data, &value)
	if err != nil {
		return nil, err
	}

	switch value.Type {
	case "NoneType":
		return starlark.None, nil
	case "string":
		v, _ := value.Data.(string)
		return starlark.String(v), nil
	case "bool":
		v, _ := value.Data.(bool)
		return starlark.Bool(v), nil
	case "int":
		v, _ := value.Data.(float64)
		return starlark.MakeInt(int(v)), nil
	case "float":
		v, _ := value.Data.(float64)
		return starlark.Float(v), nil
	}

	return nil, nil
}

type SerializedValue struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}
