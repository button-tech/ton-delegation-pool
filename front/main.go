package main

import (
	"log"
	"os"

	"github.com/gin-gonic/contrib/cors"
	"github.com/gin-gonic/contrib/static"
	"github.com/gin-gonic/gin"
)

func main() {
	dir, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	pathToStaticLanding := dir + "/dist"

	r := gin.Default()
	gin.SetMode(gin.ReleaseMode)
	r.Use(gin.Recovery())
	r.Use(cors.Default())

	r.Use(static.Serve("/", static.LocalFile(pathToStaticLanding, true)))
	r.NoRoute(func(c *gin.Context) {
       		c.File(pathToStaticLanding)
       	})
	gin.SetMode(gin.ReleaseMode)

	err = r.Run(":80")
	if err != nil {
		log.Fatal("Can't start Gin Server")
	}
}
