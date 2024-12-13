var http = require('http');
http.createServer(function (req,res) {
    res.write("AAAAAAAAAAA");
    res.end();
}).listen(8080);