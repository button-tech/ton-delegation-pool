package main

import (
	"log"
	"os"
	"time"

	"github.com/imroc/req"
	tb "gopkg.in/tucnak/telebot.v2"
)

func main() {

	b, err := tb.NewBot(tb.Settings{
		Token:  os.Getenv("BOT_TOKEN"),
		Poller: &tb.LongPoller{Timeout: 10 * time.Second},
	})

	if err != nil {
		log.Println(err)
		os.Exit(1)
	}

	b.Handle("/start", func(m *tb.Message) {
		b.Send(m.Sender, "Successfully subscribed on alert!")
		go func(m *tb.Message) {
			var activeElect, send bool
			for {
				res, err := req.Get("http://" + os.Getenv("HOST") + "/activeElectionId")
				if err != nil {
					b.Send(m.Sender, err.Error())
					time.Sleep(time.Second * 60)
					continue
				}

				r := struct {
					Result []string `json:"result"`
				}{}

				err = res.ToJSON(&r)
				if err != nil {
					b.Send(m.Sender, err.Error())
					time.Sleep(time.Second * 60)
					continue
				}

				if !send && r.Result[0] != "0" {
					b.Send(m.Sender, "Election Id status: "+r.Result[0])
					activeElect = true
					send = true
				} else if activeElect && r.Result[0] == "0" {
					b.Send(m.Sender, "Election was end")
					activeElect = false
					send = false
				}

				time.Sleep(time.Second * 30)
			}
		}(m)
	})

	b.Start()
}
