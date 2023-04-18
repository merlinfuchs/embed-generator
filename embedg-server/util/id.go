package util

import gonanoid "github.com/matoous/go-nanoid"

func UniqueID() string {
	id, _ := gonanoid.Generate("abcdefghijklmnopqrstuvwxyzAPCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", 8)
	return id
}
