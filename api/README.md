### Instructions for run API

- The the easiest way for run all project:

```
# cd ..
# docker-compose up
```

of full build
```
# cd ..
# docker-compose -f docker-compose-full-build.yml build
# docker-compose -f docker-compose-full-build.yml up
```

- Run only API in docker

1. Install and run MongoDB
```
# docker build -t image .
# docker run -it -e DB_URI=(uri mongodb) -p 3000:3000 image
```

Open your browser at http://127.0.0.1:3000/docs - API(Swagger)