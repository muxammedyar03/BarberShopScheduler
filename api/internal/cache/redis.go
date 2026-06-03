package cache

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type Store struct {
	client *redis.Client
	ttl    time.Duration
}

func New(redisURL string, ttlSeconds int) (*Store, error) {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}
	c := redis.NewClient(opt)
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := c.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis ping: %w", err)
	}
	ttl := time.Duration(ttlSeconds) * time.Second
	if ttl <= 0 {
		ttl = 60 * time.Second
	}
	return &Store{client: c, ttl: ttl}, nil
}

func (s *Store) key(prefix string, payload any) (string, error) {
	raw, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	sum := sha256.Sum256(raw)
	return fmt.Sprintf("%s:%s", prefix, hex.EncodeToString(sum[:16])), nil
}

func (s *Store) GetJSON(ctx context.Context, cacheKey string, dest any) (bool, error) {
	val, err := s.client.Get(ctx, cacheKey).Result()
	if err == redis.Nil {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, json.Unmarshal([]byte(val), dest)
}

func (s *Store) SetJSON(ctx context.Context, cacheKey string, v any) error {
	raw, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return s.client.Set(ctx, cacheKey, raw, s.ttl).Err()
}

func (s *Store) InvalidatePrefix(ctx context.Context, prefix string) error {
	iter := s.client.Scan(ctx, 0, prefix+"*", 100).Iterator()
	var keys []string
	for iter.Next(ctx) {
		keys = append(keys, iter.Val())
	}
	if err := iter.Err(); err != nil {
		return err
	}
	if len(keys) == 0 {
		return nil
	}
	return s.client.Del(ctx, keys...).Err()
}

func (s *Store) CollateKey(resource string, req any) (string, error) {
	return s.key("collate:"+resource, req)
}
