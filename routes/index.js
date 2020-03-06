var express = require('express');
var router = express.Router();
var request = require('request')
var async = require('async')
var fs = require("fs")
let cheerio = require("cheerio");
    /* GET home page. */
router.get('/', function(req, res, next) {
    console.log(req.session)
    res.render('index', { title: 'Express' });
});

router.get('/test',function(req,res,next){
    let locations = []
    request.get({
        url:"https://www.welcome2japan.tw/location/destinations/",
        method:'GET'
    },function(err,rsp,body){
        console.log(rsp.body)
        let $ = cheerio.load(rsp.body)
        let heads = $("h4").get()
        console.log(heads)
        heads.forEach(item=>{
            let parent = $(item).text().trim()
            locations.push(parent)
            let body = $(item).next()
            $(body).find('li').get().forEach(item=>{
                locations.push(parent + $(item).text().trim())
            })
        })
        console.log(locations)
        res.json({
            list:locations
        })
    })
})

router.post('/login', function(req, res, next) {
    async.waterfall([
        function(callback) {
            if (req.body.domain.indexOf("/") != -1) {
                res.json({ status: false, msg: '含有非法字元' })
            } else {
                request.get({
                    url: 'http://' + req.body.domain,
                    method: 'GET',
                    timeout: 60000,
                }, function(e, r, b) {
                    if (e) {
                        res.json({
                            status: false,
                            msg: e
                        })
                    } else {
                        if (r.statusCode == 200) {
                            callback(null)
                        } else {
                            res.json({
                                status: false,
                                msg: 'domain錯誤'
                            })
                        }
                    }
                })
            }
        },
        function(callback) {
            let login_api = 'http://' + req.body.domain + '/Site_Prog/API/plugin_api.php?mode=login&acn=' + req.body.act + '&pwd=' + req.body.pwd
            request.get({
                url: login_api,
                method: 'GET',
                timeout: 60000
            }, function(e, r, b) {
                if (e) {
                    console.log(e)
                    res.json({
                        status: false,
                        msg: e
                    })
                } else {
                    let rsp = JSON.parse(r.body)
                    if (rsp.status == "OK") {
                        req.session.user = rsp.acn
                        req.session.nu_code = rsp.nu_code
                        req.session.fb_list = []
                        req.session.task_list = []
                        let data = {}
                        data.nu_code = rsp.nu_code
                        data.acn = rsp.acn
                        callback(null, data)
                    } else {
                        res.json({
                            status: false,
                            msg: rsp.msg
                        })
                    }
                }
            })
        },
        function(data, callback) {
            fs.readFile(`./user_config/${data.acn}.json`, (err, rsp) => {
                if (err) {
                    callback(null, data)
                } else {
                    let config = JSON.parse(rsp)
                    data.day_query = config.day_query
                    data.time_query = config.time_query
                    data.machine = config.machine
                    res.json({
                        status: true,
                        info: data
                    })
                }
            })
        },
        function(data, callback) {
            let config = {
                day_query: 100,
                time_query: 100,
                today_cnt: 0,
                machine: "http://nubot70.taiwin.tw:5802"
            }
            fs.writeFile(`./user_config/${data.acn}.json`, JSON.stringify(config), err => {
                if (err) {
                    console.log(err)
                    res.json({
                        status: false,
                        msg: err
                    })
                } else {
                    data.day_query = config.day_query
                    data.time_query = config.time_query
                    data.machine = config.machine
                    res.json({
                        status: true,
                        info: data
                    })
                }
            })
        }
    ])
})

router.use(function(req, res, next) {
    if (!req.session.user) {
        res.json({ status: false, msg: "login first" })
    } else {
        next()
    }
});

router.get('/get_info', function(req, res, next) {
    fs.readFile(`./user_config/${req.session.user}.json`, (err, rsp) => {
        if (err) {
            res.json({
                status: false,
                msg: err
            })
        } else {
            let config = JSON.parse(rsp)
            config.acn = req.session.user
            config.nu_code = req.session.nu_code
            config.fb_list = req.session.fb_list
            config.task_list = req.session.task_list
            res.json({
                status: true,
                config: config
            })
        }
    })
})

router.post('/update', function(req, res, next) {
    async.waterfall([
        function(callback) {
            fs.readFile(`./user_config/${req.session.user}.json`, (err, rsp) => {
                if (err) {
                    res.json({
                        status: false,
                        msg: err
                    })
                } else {
                    let config = JSON.parse(rsp)
                    callback(null, config)
                }
            })
        },
        function(config, callback) {
            config.day_query = parseInt(req.body.daycnt)
            config.time_query = parseInt(req.body.timecnt)
            config.machine = req.body.site
            fs.writeFile(`./user_config/${req.session.user}.json`, JSON.stringify(config), err => {
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
    ])
})

router.get('/logout', function(req, res, next) {
    req.session.destroy(function(err) {
        if (err) {
            res.json({ status: false, msg: "logout fail" });
            // return;
        } else {
            res.json({ status: true });
        }
    });
})

router.get('/addcnt',function(req,res,next){
    async.waterfall([
        function(cb){
            fs.readFile(`./user_config/${req.session.user}.json`, (err, rsp) => {
                if (err) {
                    res.json({
                        status: false,
                        msg: err
                    })
                } else {
                    let config = JSON.parse(rsp)
                    callback(null, config)
                }
            })
        },
        function(config,cb){
            if(config.today_cnt < config.day_query){
                config.today_cnt ++
                fs.writeFile(`./user_config/${req.session.user}.json`, JSON.stringify(config), err => {
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
            }else{
                res.json({status:false,msg:`已達流量限制(${config.time_query})`})
            }
        }
    ])
})

module.exports = router;