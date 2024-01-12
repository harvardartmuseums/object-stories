# Object Stories

## About

## Developer Notes

### Features
* [Express 4](https://expressjs.com/) with [Handlebars](https://handlebarsjs.com/) server-side template engine
* [HAM API server-Side library](https://www.npmjs.com/package/@harvardartmuseums/ham)
* [Bootstrap 5.3](https://getbootstrap.com/docs/5.3/getting-started/introduction/) via CDN

### Requirements
* Node >=19.1.0

### Environment Setup

#### Install dependencies

```shell
> npm install
```

#### Set environment variables

* Clone the file .env-sample as .env  
* Edit .env in a text editor and set the following variables as needed
	* NODE_ENV = development | staging | production
    * HAM_APIKEY = [YOUR HAM API KEY](https://hvrd.art/api)

#### Run locally in debug mode

```shell
> npm run debug
```

## Reference Material