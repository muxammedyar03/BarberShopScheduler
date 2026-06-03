package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/barber-queue/api/internal/cache"
	"github.com/barber-queue/api/internal/collate"
	"github.com/barber-queue/api/internal/handler"
)

func main() {
	addr := env("API_ADDR", ":8080")
	dbURL := env("DATABASE_URL", "postgres://barber:barber@localhost:5432/barber_queue?sslmode=disable")
	redisURL := env("REDIS_URL", "redis://localhost:6379/0")
	corsOrigins := env("CORS_ORIGIN", "http://localhost:3000")
	cacheTTL := 60

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("db pool: %v", err)
	}
	defer pool.Close()

	var cacheStore *cache.Store
	if redisURL != "" && redisURL != "disabled" {
		cacheStore, err = cache.New(redisURL, cacheTTL)
		if err != nil {
			log.Printf("redis disabled (connect failed): %v", err)
			cacheStore = nil
		}
	}

	coll := collate.NewRunner(pool)
	api := handler.New(coll, cacheStore, pool)

	mux := http.NewServeMux()
	api.Register(mux)

	srv := &http.Server{
		Addr:              addr,
		Handler:           handler.WithCORS(mux, corsOrigins),
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("api listening on %s", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
