var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require("express-session")
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var fbRouter = require('./routes/fb');
var fs = require('fs')
var path = require('path')
var schedule = require('node-schedule')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'secret', // 對session id 相關的cookie 進行簽名
    resave: true,
    saveUninitialized: false, // 是否儲存未初始化的會話
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 設定 session 的有效時間，一週
    },
}))

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/fb', fbRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(1, 6)];
rule.hour = 0;
rule.minute = 0;
var j = schedule.scheduleJob(rule, function(){
　　fs.readdir('./user_config',function(err,files){
    if(err){
        console.log(err)
    }else{
        files.forEach(file=>{
            if(file.slice(-4) == '.json'){
                fs.readFile(`./user_config/${file}.json`, (err, rsp) => {
                    if (err) {
                        console.log(err)
                    } else {
                        let config = JSON.parse(rsp)
                        config.today_cnt = 0
                        fs.writeFile(`./user_config/${file}.json`, JSON.stringify(config), err => {
                            if (err) {
                                console.log(err)
                                res.json({
                                    status: false,
                                    msg: err
                                })
                            } else {
                                res.json({
                                    status: true
                                })
                            }
                        })
                    }
                })
            }
        })
    }
})
});

module.exports = app;