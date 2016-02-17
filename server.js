var express = require('express'),
path = require('path'),
apiRouter = require('./api/router');
var app = express();

var port = process.env.PORT || 3000;

app.use(express.static('dist'));

app.use('/api', apiRouter);

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname,'index.html'))
})


app.listen(port, function(){
  console.log('listening on port ', port);
});
