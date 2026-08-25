package template

import (
	"encoding/json"
	"fmt"
	"reflect"
	"strconv"

	"errors"

	"github.com/botlabs-gg/yagpdb/v2/lib/template"
)

func isContainer(v interface{}) bool {
	rv, _ := indirect(reflect.ValueOf(v))
	switch rv.Kind() {
	case reflect.Array, reflect.Slice, reflect.Map:
		return true
	default:
		return false
	}
}

// Cyclic value detection is modified from encoding/json/encode.go.
const startDetectingCyclesAfter = 250

type cyclicValueDetector struct {
	ptrLevel uint
	ptrSeen  map[interface{}]struct{}
}

func (c *cyclicValueDetector) Check(v reflect.Value) error {
	v, _ = indirect(v)
	switch v.Kind() {
	case reflect.Map:
		if c.ptrLevel++; c.ptrLevel > startDetectingCyclesAfter {
			ptr := v.Pointer()
			if _, ok := c.ptrSeen[ptr]; ok {
				return fmt.Errorf("encountered a cycle via %s", v.Type())
			}
			c.ptrSeen[ptr] = struct{}{}
		}

		it := v.MapRange()
		for it.Next() {
			if err := c.Check(it.Value()); err != nil {
				return err
			}
		}
		c.ptrLevel--
		return nil
	case reflect.Array, reflect.Slice:
		if c.ptrLevel++; c.ptrLevel > startDetectingCyclesAfter {
			ptr := struct {
				ptr uintptr
				len int
			}{v.Pointer(), v.Len()}
			if _, ok := c.ptrSeen[ptr]; ok {
				return fmt.Errorf("encountered a cycle via %s", v.Type())
			}
			c.ptrSeen[ptr] = struct{}{}
		}

		for i := 0; i < v.Len(); i++ {
			elem := v.Index(i)
			if err := c.Check(elem); err != nil {
				return err
			}
		}
		c.ptrLevel--
		return nil
	default:
		return nil
	}
}

func detectCyclicValue(v interface{}) error {
	c := &cyclicValueDetector{ptrSeen: make(map[interface{}]struct{})}
	return c.Check(reflect.ValueOf(v))
}

type Dict map[interface{}]interface{}

func (d Dict) Set(key interface{}, value interface{}) (string, error) {
	d[key] = value
	if isContainer(value) {
		if err := detectCyclicValue(d); err != nil {
			return "", template.UncatchableError(err)
		}
	}
	return "", nil
}

func (d Dict) Get(key interface{}) interface{} {
	out, ok := d[key]
	if !ok {
		switch key.(type) {
		case int:
			out = d[ToInt64(key)]
		case int64:
			out = d[tmplToInt(key)]
		}
	}
	return out
}

func (d Dict) Del(key interface{}) string {
	delete(d, key)
	return ""
}

func (d Dict) HasKey(k interface{}) (ok bool) {
	_, ok = d[k]
	return
}

func (d Dict) MarshalJSON() ([]byte, error) {
	md := make(map[string]interface{})
	for k, v := range d {
		krv := reflect.ValueOf(k)
		switch krv.Kind() {
		case reflect.String:
			md[krv.String()] = v
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			md[strconv.FormatInt(krv.Int(), 10)] = v
		case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64, reflect.Uintptr:
			md[strconv.FormatUint(krv.Uint(), 10)] = v
		default:
			return nil, fmt.Errorf("cannot encode dict with key type %s; only string and integer keys are supported", krv.Type())
		}
	}
	return json.Marshal(md)
}

type SDict map[string]interface{}

func (d SDict) Set(key string, value interface{}) (string, error) {
	d[key] = value
	if isContainer(value) {
		if err := detectCyclicValue(d); err != nil {
			return "", template.UncatchableError(err)
		}
	}
	return "", nil
}

func (d SDict) Get(key string) interface{} {
	return d[key]
}

func (d SDict) Del(key string) string {
	delete(d, key)
	return ""
}

func (d SDict) HasKey(k string) (ok bool) {
	_, ok = d[k]
	return
}

type Slice []interface{}

func (s Slice) Append(item interface{}) (interface{}, error) {
	if len(s)+1 > 10000 {
		return nil, errors.New("resulting slice exceeds slice size limit")
	}

	switch v := item.(type) {
	case nil:
		result := reflect.Append(reflect.ValueOf(&s).Elem(), reflect.Zero(reflect.TypeOf((*interface{})(nil)).Elem()))
		return result.Interface(), nil
	default:
		result := reflect.Append(reflect.ValueOf(&s).Elem(), reflect.ValueOf(v))
		return result.Interface(), nil
	}
}

func (s Slice) Set(index int, item interface{}) (string, error) {
	if index >= len(s) {
		return "", errors.New("Index out of bounds")
	}

	s[index] = item
	if isContainer(item) {
		if err := detectCyclicValue(s); err != nil {
			return "", template.UncatchableError(err)
		}
	}
	return "", nil
}

func (s Slice) AppendSlice(slice interface{}) (interface{}, error) {
	val, _ := indirect(reflect.ValueOf(slice))
	switch val.Kind() {
	case reflect.Slice, reflect.Array:
	// this is valid

	default:
		return nil, errors.New("value passed is not an array or slice")
	}

	if len(s)+val.Len() > 10000 {
		return nil, errors.New("resulting slice exceeds slice size limit")
	}

	result := reflect.ValueOf(&s).Elem()
	for i := 0; i < val.Len(); i++ {
		switch v := val.Index(i).Interface().(type) {
		case nil:
			result = reflect.Append(result, reflect.Zero(reflect.TypeOf((*interface{})(nil)).Elem()))

		default:
			result = reflect.Append(result, reflect.ValueOf(v))
		}
	}

	return result.Interface(), nil
}

func (s Slice) StringSlice(flag ...bool) interface{} {
	strict := false
	if len(flag) > 0 {
		strict = flag[0]
	}

	StringSlice := make([]string, 0, len(s))

	for _, Sliceval := range s {
		switch t := Sliceval.(type) {
		case string:
			StringSlice = append(StringSlice, t)

		case fmt.Stringer:
			if strict {
				return nil
			}
			StringSlice = append(StringSlice, t.String())

		default:
			if strict {
				return nil
			}
		}
	}

	return StringSlice
}

func withOutputLimit(f func(...interface{}) string, limit int) func(...interface{}) (string, error) {
	return func(args ...interface{}) (string, error) {
		out := f(args...)
		if len(out) > limit {
			return "", fmt.Errorf("string grew too long: length %d (max %d)", len(out), limit)
		}
		return out, nil
	}
}

func withOutputLimitF(f func(string, ...interface{}) string, limit int) func(string, ...interface{}) (string, error) {
	return func(format string, args ...interface{}) (string, error) {
		out := f(format, args...)
		if len(out) > limit {
			return "", fmt.Errorf("string grew too long: length %d (max %d)", len(out), limit)
		}
		return out, nil
	}
}
