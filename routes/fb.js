var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.use(function(req, res, next) {
    if (!req.session.user) {
        res.json({ status: false, msg: "login first" })
    } else {
        next()
    }
});

router.post('/add_fblist', function(req, res, next) {
    try {
        let new_arr = JSON.parse(req.body.fblist)
        req.session.fb_list = req.session.fb_list.concat(new_arr)
        console.log(req.session.fb_list)
        res.json({
            status: true
        })
    } catch (e) {
        console.log(e)
        res.json({ status: false, msg: e })
    }
})
router.get('/del_fburl', function(req, res, next) {
    let target = req.query.id
    let idx = req.session.fb_list.indexOf(target)
    if (idx != -1) {
        req.session.fb_list.splice(idx, 1)
        res.json({
            status: true
        })
    } else {
        res.json({
            status: false,
            msg: "can't find the item in list"
        })
    }
})

router.get('/fb_list', function(req, res, next) {
    try {
        console.log(req.session)
        let task = req.query.task
        let tmp_list = req.session.fb_list
        req.session.fb_list = []
        req.session.task_list.push(task)
        res.json({
            status: true,
            fb_list: tmp_list
        })
        // console.log(req.session.task_list)
    } catch (e) {
        res.json({
            status: false,
            msg: e
        })
    }
})

router.get('/finish', function(req, res, next) {
    let idx = req.session.task_list.indexOf(req.query.task)
    if (idx != -1) {
        req.session.task_list.splice(idx, 1)
    }
    res.json({
        status: true
    })
})


module.exports = router;